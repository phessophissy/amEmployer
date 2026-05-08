import { useEffect } from 'react';
import { useNotifications } from './useNotifications';
export function useNotificationBridge(payments: any[], taskUpdates: any[]) {
  const { add } = useNotifications();
  useEffect(() => {
    payments.forEach(p => {
      add('payment', 'Payment Sent', `${parseFloat(p.amount).toFixed(4)} cUSD sent to worker`);
    });
  }, [payments.length]);
  useEffect(() => {
    taskUpdates.forEach(t => {
      if (t.status === 'paid') add('task', 'Task Completed', `"${t.title || t.taskId}" validated and paid`);
    });
  }, [taskUpdates.length]);
}
