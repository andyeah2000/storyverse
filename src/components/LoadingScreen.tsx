import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-[#FAFAF9] flex flex-col items-center justify-center z-50">
      {/* Logo */}
      <div className="w-14 h-14 rounded-2xl bg-[#1C1917] flex items-center justify-center mb-6">
        <span className="text-white text-2xl font-bold">S</span>
      </div>
      
      {/* Loading Spinner */}
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-[#E7E5E4]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#1C1917] animate-spin" />
      </div>
      
      {/* Message */}
      <p className="text-sm text-[#78716C] font-medium">{message}</p>
    </div>
  );
};

export default LoadingScreen;

