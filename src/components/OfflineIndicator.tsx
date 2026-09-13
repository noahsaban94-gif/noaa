import React, { useEffect, useState } from 'react';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600 text-white px-4 py-2.5 shadow-xl border border-amber-500/50 backdrop-blur-md text-xs font-semibold animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span>מצב אופליין — פועל מתוך זיכרון מקומי (IndexedDB)</span>
      <Database className="w-3.5 h-3.5 opacity-80 mr-1" />
    </div>
  );
};
