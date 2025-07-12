'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`flex items-start p-4 border rounded-lg shadow-lg transition-all duration-300 ${getStyles()}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium">{title}</h4>
        {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(id), 300);
        }}
        className="flex-shrink-0 ml-3 p-1 text-gray-400 transition-colors cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;
