import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-ink"></div>
    </div>
  );
};

export default LoadingSpinner;
