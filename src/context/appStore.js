import { createContext } from 'react';

// Filter out non-financial, navigational, or irrelevant system noise from audit logs
export const isRelevantAuditLog = (log) => {
  if (!log || typeof log !== 'object' || typeof log.action !== 'string') return false;
  const noisyActions = [
    'MONTH_CHANGED',
    'MEETING_OPENED',
    'MEETING_CONCLUDED',
    'FUND_HEALTH_CHECK'
  ];
  if (noisyActions.includes(log.action)) return false;

  const details = String(log.details || '').toLowerCase();
  if (
    details.includes('switched meeting month') ||
    details.includes('meeting in session') ||
    details.includes('meeting completed') ||
    details.includes('liquidity check')
  ) {
    return false;
  }
  return true;
};

export const AppContext = createContext();

