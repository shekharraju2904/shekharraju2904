import React from 'react';
import { LogoIcon } from './Icons';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-2 flex items-center justify-center">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary to-secondary">
              <LogoIcon className="w-10 h-10 text-white" />
            </div>
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold text-neutral-300">Loading Application...</p>
    </div>
  );
};

export default LoadingSpinner;
