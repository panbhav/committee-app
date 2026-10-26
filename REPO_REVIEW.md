# Repository review — 17 October 2026

Reviewed the React application, context and persistence, calculations, document/export helpers, Firebase adapter, maintenance scripts, public app metadata, and deployment/Android configuration. Changes are local and have not been deployed. No live Firebase records were read or changed during verification.

## Corrected in this change

| Issue | Correction |
| --- | --- |
| Conditional hooks in member dashboard and installment editor | Hooks now execute in a stable order. |
| Reload silently restored the default administrator | Persist and restore the selected member or borrower; invalid/missing sessions return to sign-in. |
| Test OTP and hidden hardcoded master unlock shipped as security | Removed; explicit local-only demo identities; production access fails closed pending verified sign-in. |
| Demo sessions could read/write a live shared Firebase document | No Firebase initialization in demo mode; cloud requires explicit configuration and an authenticated user. |
| Render-time schema cleanup discarded saved financial records | Removed automatic deletion; malformed JSON falls back safely. |
| Member register referenced undefined payment/bill variables | Corrected context bindings; verified the register opens. |
| Borrower schedule fabricated receipt IDs from an installment counter | Show projected dates and amounts, remove receipt claims, include current installment in estimated balance. |
| Loan dates always assumed September | Selected meeting month now drives schedules and year rollover. |
| New loans disappeared in later unsaved months; ended loans kept recurring | Project from nearest saved ledger, retain new loans, and filter outside loan terms. |
| Partial payments disappeared from pending filter | Partial/short records remain pending and count toward received money. |
| Payment and loan input accepted invalid amounts; principal could silently shrink | Shared domain validation rejects non-finite, negative, inconsistent, and over-limit values. |
| Repeated approval could duplicate a request | Require pending status and successful disbursement before approval. This is a client guard, not a multi-device transaction. |
| Undo targeted the active month rather than the original one and could be reused | Bind undo metadata to a month, reject newer conflicts, consume entries, and persist loan undo in monthly ledgers. Legacy undo entries with no month are refused. |
| Sequential approval logs could drop an earlier disbursement log | Keep a synchronous reference to appended audit entries. |
| Annual rounding distributed ₹5 more than the pool | Distribute whole rupees with deterministic remainder allocation; match the Excel sheet. |
| Reset left monthly loans and annual configuration behind | Reset all relevant ledgers/configuration; preserve unrelated browser keys. |
| Maintenance script overwrote the database on ordinary execution | Inspect only by default; reset requires both an explicit flag and environment confirmation. |
| Export libraries made the initial bundle unnecessarily large | Load spreadsheet/PDF dependencies on demand. |
| Tiny phone-only layout on desktop, unlabelled inputs, inaccessible dialogs | Responsive desktop sidebar and card grids, mobile navigation, redesigned sign-in, focus trapping, Escape dismissal, labels, browser zoom, reduced-motion support, and error/storage notices. |
| Broken public icon paths and insufficient CI runtime | Use an existing SVG icon, declare Node 22.12+, and run lint/tests in CI. |

## Data discrepancies preserved for reconciliation

The source-data installment total is **₹5,84,993**, while the original verification script cites **₹5,84,902**: a **₹91 difference**. All 87 stored installments match their configured principal/rate/tenure formulas. There is no source workbook here establishing which record should change; no principal or agreed installment was altered to force a match.

PRAHLAD has **₹2,50,000** of self-loan principal against a **₹2,00,000** limit. Existing records remain visible; new loans are checked against remaining limits.

The common pool is **₹4,20,490**. Equal rounding previously allocated **₹4,20,495**. Whole-rupee allocation now preserves ₹4,20,490, with individual dividends of ₹28,032 or ₹28,033. Total estimated payout, including ₹2,32,200 commissions, is **₹6,52,690**.

## Work required before real production use

1. **Authentication and server authorization:** implement verified sign-in with server-owned account/role mapping and Firebase rules. Client-side names, local storage, license JSON, and UI guards cannot authorize financial access. Existing deployed Firebase rules were not inspected or changed.
2. **Concurrent writes:** the retained cloud adapter writes whole arrays/maps to one document. Two devices can overwrite changes. Move payments, loans, requests, and immutable audit events to individual documents; use transactions/idempotency for approval and payment operations. Navigation is now local; the legacy listener still needs redesign around per-month records before enabling it.
3. **Documents and privacy:** attachments remain embedded base64 data in browser/cloud state. Move real identity documents to access-controlled object storage, store metadata separately, mask identifiers in shared views, and define retention/access policy. The shared Firestore document has a size limit incompatible with accumulating attachments. Do not place real identity records in the demo.
4. **Accounting policy:** the cash reserve plus receipts is an estimate; it does not subtract all loan disbursements or track a complete cash transaction ledger. Progress counters and projected dates do not establish actual receipts. Annual automatic totals use the selected ledger, not a complete cumulative historical disbursement ledger. Reconcile these models before using them as a financial source of truth.
5. **Receipt-backed history:** the borrower schedule now distinguishes earlier scheduled amounts from current dues and no longer invents receipt IDs or claims payments were received. Its estimated balance includes the current installment. The compact register counter retains the legacy “after current” balance convention; a future receipt ledger should replace inferred progress throughout.
6. **Exports and native delivery:** Excel/PDF generation is bundled and exercised in the web app; native Android file handling, offline installability, and device behavior require dedicated testing. The manifest alone does not provide an offline service worker.

## Validation

- `npm run lint`: zero errors/warnings.
- `npm test`: 11 regression cases covering all 87 original installment amounts, rates, date rollover, invalid input, payment reconciliation, undo guards, dividend conservation, monthly projection, and storage recovery/reset.
- `npm run verify:calculations`: original-loan formulas pass; reconciliation discrepancies above remain visible.
- `npm run build`: succeeds with the native Vite config loader. Spreadsheet/PDF vendor chunks remain large, but are loaded on demand.
- Excel and PDF downloads succeeded; the downloaded workbook contains all four sheets and its annual total row is ₹4,20,490 pool + ₹2,32,200 commission = ₹6,52,690.
- Browser checks: administrator and member views, member identity after reload, full and partial local payments, paid/pending filters, consuming undo, shared register, tenure-dependent default rates, annual payout rendering, mobile loan search/empty states, borrower identity after reload, projected passbook labels, and mobile layout without horizontal overflow.
- Live cloud mutations, remote rule enforcement, native Android build, and real SMS delivery were not tested.
