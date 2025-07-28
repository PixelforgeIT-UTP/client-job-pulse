import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationTriggerProps {
  quoteId: string;
  status: string;
  onStatusChange?: (newStatus: string) => void;
}

export const NotificationTrigger = ({ quoteId, status, onStatusChange }: NotificationTriggerProps) => {
  const { showLocalNotification } = usePushNotifications();

  useEffect(() => {
    const sendSupervisorNotification = async () => {
      if (status === 'pending_supervisor_approval') {
        try {
          // Get all supervisors and admins
          const { data: supervisors } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['supervisor', 'admin']);

          if (supervisors && supervisors.length > 0) {
            const userIds = supervisors.map(s => s.id);

            // Send push notification via edge function
            const { error } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userIds,
                title: 'New Quote Requires Approval',
                body: `Quote #${quoteId.slice(-8)} is awaiting supervisor approval`,
                data: {
                  type: 'quote_approval',
                  quoteId,
                  url: `/quotes/${quoteId}`
                }
              }
            });

            if (error) {
              console.error('Failed to send push notification:', error);
            }

            // Also show local notification as fallback
            showLocalNotification({
              title: 'New Quote Requires Approval',
              body: `Quote #${quoteId.slice(-8)} is awaiting supervisor approval`,
              data: {
                type: 'quote_approval',
                quoteId,
                url: `/quotes/${quoteId}`
              }
            });
          }
        } catch (error) {
          console.error('Error sending supervisor notification:', error);
        }
      }
    };

    sendSupervisorNotification();
  }, [status, quoteId, showLocalNotification]);

  return null;
};