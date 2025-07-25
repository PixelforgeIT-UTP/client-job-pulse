import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private toast: any;

  constructor(toast: any) {
    this.toast = toast;
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      this.toast({
        title: "Not supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      this.toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      this.toast({
        title: "Notifications enabled",
        description: "You'll now receive push notifications for important updates",
      });
      return true;
    } else {
      this.toast({
        title: "Notifications disabled",
        description: "You won't receive push notifications",
        variant: "destructive",
      });
      return false;
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      console.error('No service worker registration');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI-7gcDDi-1qSB6j2S7N1Y7Z8nLa1YKO_uYPiPWCrb-3p_yB6zL_v0w5m8' // Replace with your VAPID public key
        ),
      });

      // Save subscription to database
      await this.saveSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_enabled: true,
          push_subscription: subscription.toJSON() as any,
        });
    } catch (error) {
      console.error('Failed to save push subscription:', error);
    }
  }

  private async removeSubscription(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('notification_preferences')
        .update({
          push_enabled: false,
          push_subscription: null,
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification (fallback)
  showLocalNotification(notification: PushNotification): void {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge,
        tag: notification.tag,
        data: notification.data,
      });
    }
  }
}

export const usePushNotifications = () => {
  const { toast } = useToast();
  const service = new PushNotificationService(toast);

  return {
    initialize: () => service.initialize(),
    requestPermission: () => service.requestPermission(),
    subscribe: () => service.subscribe(),
    unsubscribe: () => service.unsubscribe(),
    showLocalNotification: (notification: PushNotification) => 
      service.showLocalNotification(notification),
  };
};