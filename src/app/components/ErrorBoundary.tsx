'use client'

import React, { useState, useEffect, useCallback } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Custom hook for error boundary functionality
 */
const useErrorBoundary = () => {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
  });

  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Error caught by boundary:', error, errorInfo);
    setErrorState({ hasError: true, error });
  }, []);

  const resetError = useCallback(() => {
    setErrorState({ hasError: false, error: null });
  }, []);

  const reloadPage = useCallback(() => {
    resetError();
    window.location.reload();
  }, [resetError]);

  return {
    errorState,
    handleError,
    resetError,
    reloadPage,
  };
};

/**
 * Functional Error Boundary component
 * Note: This is a simplified version since React Error Boundaries require class components
 * For production, consider using react-error-boundary library
 */
const ErrorBoundary: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const { errorState, handleError, reloadPage } = useErrorBoundary();

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(event.error, { componentStack: event.filename || '' });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(new Error(event.reason), { componentStack: 'Promise rejection' });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  if (errorState.hasError) {
    return (
      <div className="flex fixed inset-0 z-50 flex-col justify-center items-center bg-black bg-opacity-60 animate-fade-in">
        <div className="flex flex-col items-center p-8 w-full max-w-md bg-white rounded-lg shadow-lg transition-all duration-300 dark:bg-gray-900">
          <h2 className="mb-2 text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="mb-4 text-center text-gray-700 dark:text-gray-200">
            An unexpected error occurred. Please try reloading the page.<br/>
            <span className="text-xs text-gray-400">{errorState.error?.message}</span>
          </p>
          <button
            className="px-4 py-2 text-white bg-blue-600 rounded transition-colors hover:bg-blue-700"
            onClick={reloadPage}
            type="button"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary; 