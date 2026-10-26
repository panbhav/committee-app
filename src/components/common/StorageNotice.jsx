import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function StorageNotice() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const handleFailure = () => setFailed(true);
    window.addEventListener('comm-storage-error', handleFailure);
    return () => window.removeEventListener('comm-storage-error', handleFailure);
  }, []);
  if (!failed) return null;
  return <div role="alert" className="storage-notice"><AlertCircle size={20} /><span>Browser storage is full or unavailable. Recent changes may not be saved. Export your records before reloading.</span></div>;
}
