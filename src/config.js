// Demo sessions are local only. Never connect a demo identity to live records.
export const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';
export const CLOUD_SYNC_ENABLED = !DEMO_MODE && import.meta.env.VITE_ENABLE_CLOUD_SYNC === 'true';
