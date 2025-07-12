'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification, { NotificationProps } from '@/components/ui/Notification';

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationProps, 'id' | 'onDismiss'>) => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback(
    (notification: Omit<NotificationProps, 'id' | 'onDismiss'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: NotificationProps = {
        ...notification,
        id,
        onDismiss: dismissNotification,
      };

      setNotifications((prev) => [...prev, newNotification]);
    },
    [dismissNotification],
  );

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification }}>
      {children}

      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <Notification key={notification.id} {...notification} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
