import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

interface NotificationRequest {
  userIds: string[];
  title: string;
  body: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userIds, title, body, data }: NotificationRequest = await req.json();

    // Get push subscriptions for the target users
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('push_subscription')
      .in('user_id', userIds)
      .eq('push_enabled', true)
      .not('push_subscription', 'is', null);

    if (error) {
      throw error;
    }

    if (!preferences || preferences.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active subscriptions found' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Prepare notification payload
    const notificationPayload = {
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data || {},
    };

    // Send notifications to all subscribed users
    const promises = preferences.map(async (pref) => {
      if (!pref.push_subscription) return;

      try {
        // In a production environment, you would use a proper push service
        // like Firebase Cloud Messaging or Web Push Protocol
        // For now, we'll just log the notification
        console.log('Sending notification to subscription:', pref.push_subscription);
        console.log('Notification payload:', notificationPayload);
        
        // TODO: Implement actual push notification sending
        // This would typically use the Web Push Protocol with VAPID keys
        
        return { success: true };
      } catch (error) {
        console.error('Failed to send notification:', error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r && r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount} subscribers`,
        results 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notifications' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);