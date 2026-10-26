// A malformed cache must not prevent the application from opening.
export function readStoredJSON(key, fallback, validate = () => true) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function clearAppStorage() {
  Object.keys(localStorage).filter(key => key.startsWith('comm_')).forEach(key => localStorage.removeItem(key));
}

export function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    window.dispatchEvent(new Event('comm-storage-error'));
    return false;
  }
}
