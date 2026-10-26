import { createHash } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { applyCommand } from './lib/commands.js';
import { authorizeAccount, assertRecent, scopeWorkspace, allowedKeys, reject, redactError } from './lib/security.js';

initializeApp();
const db = getFirestore();
const emulator = process.env.FUNCTIONS_EMULATOR === 'true';
const origins = (process.env.APP_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
const options = { region: 'asia-south1', enforceAppCheck: !emulator, cors: emulator ? [/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/] : origins, maxInstances: 3, concurrency: 20, timeoutSeconds: 30, memory: '256MiB' };
const ledgerRef = db.doc('private/ledger');
const configRef = db.doc('settings/access');
const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const hash = data => createHash('sha256').update(stable(data)).digest('hex');

async function identityFor(request) {
  if (!request.auth?.uid || !/^[A-Za-z0-9_-]{1,128}$/.test(request.auth.uid)) reject('unauthenticated', 'Sign in to continue.');
  if (!emulator) {
    const origin = request.rawRequest.get('origin');
    if (!origins.length || !origins.includes(origin) || !origin.startsWith('https://')) reject('permission-denied', 'This application origin is not permitted.');
    const bearer = request.rawRequest.get('authorization');
    if (!bearer?.startsWith('Bearer ')) reject('unauthenticated', 'Sign in to continue.');
    try { return { ...(await getAuth().verifyIdToken(bearer.slice(7), true)), uid: request.auth.uid }; }
    catch { reject('unauthenticated', 'Your session is no longer valid. Sign in again.'); }
  }
  return { ...request.auth.token, uid: request.auth.uid };
}
function checkAccess(config, ledger, account, identity) {
  const principal = authorizeAccount(account, identity);
  if (!config?.isAppActive) reject('failed-precondition', 'Workspace access is suspended. Contact your administrator.');
  if (!ledger || !Number.isSafeInteger(ledger.revision)) reject('failed-precondition', 'The secure ledger has not been initialized.');
  return principal;
}
function rateLimit(snapshot, max, now) {
  const prior = snapshot.exists ? snapshot.data() : {};
  const active = Number.isFinite(prior.windowStart) && now - prior.windowStart < 60000;
  const count = active ? prior.count + 1 : 1;
  if (count > max) reject('resource-exhausted', 'Too many requests. Please wait a minute.');
  return { windowStart: active ? prior.windowStart : now, count };
}
async function safeCall(handler, request) {
  try { return await handler(request); }
  catch (error) {
    const safe = redactError(error);
    if (safe.code === 'internal') logger.error('Secure workspace operation failed', { code: error.code || 'unknown' });
    throw new HttpsError(safe.code, safe.message);
  }
}
export const getWorkspace = onCall(options, request => safeCall(async () => {
  allowedKeys(request.data || {}, []);
  const identity = await identityFor(request);
  const accountRef = db.doc(`accounts/${identity.uid}`);
  const limitRef = db.doc(`rateLimits/read_${identity.uid}`);
  const now = Date.now();
  return db.runTransaction(async tx => {
    const [account, config, ledger, limit] = await tx.getAll(accountRef, configRef, ledgerRef, limitRef);
    const principal = checkAccess(config.data(), ledger.data(), account.data(), identity);
    const quota = rateLimit(limit, 120, now);
    tx.set(limitRef, quota);
    return scopeWorkspace(ledger.data(), principal);
  });
}, request));

export const mutateWorkspace = onCall(options, request => safeCall(async () => {
  allowedKeys(request.data, ['action', 'payload', 'meetingMonth', 'requestId', 'expectedRevision']);
  const identity = await identityFor(request);
  assertRecent(identity);
  const input = request.data;
  if (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.requestId)) reject('invalid-argument', 'Missing operation identifier.');
  if (Buffer.byteLength(stable(input)) > 8192) reject('invalid-argument', 'This request is too large. Attachments are not accepted.');
  const accountRef = db.doc(`accounts/${identity.uid}`);
  const operationRef = db.doc(`operations/${identity.uid}_${input.requestId}`);
  const auditRef = db.doc(`auditEvents/${input.requestId}`);
  const limitRef = db.doc(`rateLimits/write_${identity.uid}`);
  const requestHash = hash(input);
  const now = Date.now();
  return db.runTransaction(async tx => {
    const [account, config, ledger, operation, limit] = await tx.getAll(accountRef, configRef, ledgerRef, operationRef, limitRef);
    const source = ledger.data();
    const principal = checkAccess(config.data(), source, account.data(), identity);
    if (operation.exists) {
      if (operation.data().requestHash !== requestHash) reject('already-exists', 'The operation identifier was already used.');
      return operation.data().response;
    }
    const quota = rateLimit(limit, 30, now);
    let applied;
    if (input.action === 'undo') {
      if (principal.role !== 'admin') reject('permission-denied', 'Administrator access is required.');
      allowedKeys(input.payload, ['eventId']);
      if (typeof input.payload.eventId !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.payload.eventId)) reject('invalid-argument', 'Choose a valid audit entry.');
      const event = await tx.get(db.doc(`auditEvents/${input.payload.eventId}`));
      const original = source.auditLogs.find(item => item.id === input.payload.eventId);
      if (!event.exists || !original?.canRollback || event.data().revision !== source.revision || original.meetingMonth !== input.meetingMonth || input.expectedRevision !== source.revision) reject('failed-precondition', 'Only the latest reversible action in its original month can be undone.');
      const undoPatch = event.data().undoPatch;
      allowedKeys(undoPatch, ['members', 'loansByMonth', 'paymentsByMonth', 'monthlyUnit', 'availableCashFund', 'annualMeetingConfig', 'loanRequests']);
      const actor = source.members.find(member => member.id === principal.memberId);
      const audit = { id: input.requestId, timestamp: new Date(now).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), actor: actor.name, actorUid: principal.uid, action: 'undo', details: `Reversed operation ${original.id}.`, canRollback: false, meetingMonth: input.meetingMonth, revision: source.revision + 1 };
      const state = { ...source, ...undoPatch, revision: source.revision + 1, auditLogs: [audit, ...source.auditLogs.map(item => item.id === original.id ? { ...item, canRollback: false } : item)].slice(0, 200) };
      applied = { state, audit, undoPatch: {}, result: true };
    } else applied = applyCommand(source, principal, input, new Date(now));
    if (Buffer.byteLength(JSON.stringify(applied.state)) > 750000 || Buffer.byteLength(JSON.stringify(applied.undoPatch)) > 750000) reject('resource-exhausted', 'The ledger needs archival before further changes. Contact your administrator.');
    const response = { result: applied.result, revision: applied.state.revision };
    tx.set(ledgerRef, applied.state);
    tx.create(auditRef, { ...applied.audit, undoPatch: applied.undoPatch, createdAt: new Date(now) });
    tx.create(operationRef, { requestHash, response, createdAt: new Date(now) });
    tx.set(limitRef, quota);
    return response;
  });
}, request));
