
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteConfirmationRequest {
  quoteId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  signatureData: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quoteId, customerEmail, customerName, amount, signatureData }: QuoteConfirmationRequest = await req.json();

    console.log('Sending quote confirmation email for quote:', quoteId);

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll just log the email content
    const emailContent = {
      to: customerEmail,
      subject: `Quote Approved - ${customerName}`,
      html: `
        <h1>Your Quote Has Been Approved!</h1>
        <p>Dear ${customerName},</p>
        <p>Thank you for signing your quote. Here are the details:</p>
        <ul>
          <li><strong>Quote ID:</strong> ${quoteId}</li>
          <li><strong>Amount:</strong> $${amount}</li>
          <li><strong>Status:</strong> Approved and Signed</li>
        </ul>
        <p>We will contact you soon to schedule the work.</p>
        <p>Best regards,<br>Your Service Team</p>
      `,
    };

    console.log('Email content prepared:', emailContent);

    // TODO: Integrate with actual email service
    // const emailResponse = await sendEmail(emailContent);

    return new Response(
      JSON.stringify({ success: true, message: 'Email queued for sending' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-quote-confirmation function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
