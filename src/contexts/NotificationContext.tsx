import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { subscribeToPatients } from '@/services/firebase';
import type { Patient } from '@/types';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  type: 'warning' | 'error';
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToPatients((patients) => {
      const newNotifications: Notification[] = [];

      patients.forEach((patient) => {
        if (!patient.paidDays || patient.paidDays <= 0) return;

        const attendance = patient.attendance || {};
        const presentDays = Object.values(attendance).filter(status => status === 'present').length;
        
        if (presentDays >= patient.paidDays) {
          newNotifications.push({
            id: `limit-${patient.id}`,
            patientId: patient.id!,
            patientName: patient.fullName,
            message: `Payment limit reached (${presentDays}/${patient.paidDays} days).`,
            type: 'error',
            timestamp: Date.now(),
          });
        } else if (presentDays === patient.paidDays - 1) {
          newNotifications.push({
            id: `warning-${patient.id}`,
            patientId: patient.id!,
            patientName: patient.fullName,
            message: `Payment limit nearing (${presentDays}/${patient.paidDays} days). 1 day remaining.`,
            type: 'warning',
            timestamp: Date.now(),
          });
        }
      });

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, clearNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
