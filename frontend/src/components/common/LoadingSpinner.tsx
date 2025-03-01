import React from 'react';

type LoadingSpinnerProps = {
  size?: 'small' | 'medium' | 'large';
  text?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  text
}) => {
  const spinnerSizes = {
    small: 'h-5 w-5 border-2',
    medium: 'h-10 w-10 border-2',
    large: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full ${spinnerSizes[size]} border-t-indigo-600 border-indigo-600/20`} />
      {text && (
        <p className="mt-3 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
