import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-300 ${
      isOnline 
        ? 'bg-emerald-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span className="text-sm font-medium">You're offline</span>
        </>
      )}
    </div>
  );
};

export default NetworkStatus;

