import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'blue', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          border-2 border-t-transparent 
          rounded-full 
          animate-spin
        `}
      ></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {text}
        </p>
      )}
    </div>
  );
};

// Full page loading spinner
export const FullPageSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    </div>
  );
};

// Inline loading spinner for buttons
export const ButtonSpinner = ({ size = 'small' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        border-2 border-white border-t-transparent 
        rounded-full 
        animate-spin
      `}
    ></div>
  );
};

// Card loading skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
    </div>
  );
};

// Table loading skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-t-lg mb-1"></div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex p-4 space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;