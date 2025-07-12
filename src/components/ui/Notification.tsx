'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300); // Wait for fade out animation
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500 transition-colors duration-200" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500 transition-colors duration-200" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 transition-colors duration-200" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50/95 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-50/95 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
      default:
        return 'bg-blue-50/95 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'flex items-start p-4 border rounded-lg shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out',
        'hover:shadow-xl hover:scale-[1.02]',
        getStyles(),
        isAnimating ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0',
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3 mt-0.5 animate-fade-in">{getIcon()}</div>
      <div className="flex-1 min-w-0 animate-fade-in-up">
        <h4 className="text-sm font-medium transition-colors duration-200">{title}</h4>
        {message && <p className="mt-1 text-sm opacity-90 transition-colors duration-200">{message}</p>}
      </div>
      <button
        onClick={() => {
          setIsAnimating(true);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(id), 300);
          }, 300);
        }}
        className="flex-shrink-0 ml-3 p-1 text-gray-400 transition-all duration-200 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 hover:scale-110 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;
