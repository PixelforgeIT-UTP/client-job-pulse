
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

interface QuoteConfirmationRequest {
  quoteId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  signatureData: string;
}

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateAmount(amount: number): boolean {
  return typeof amount === 'number' && amount >= 0 && amount <= 1000000; // Max $1M
}

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = `email:${email}`;
  const limit = rateLimitStore.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 3) { // Max 3 emails per minute per email address
    return false;
  }
  
  limit.count++;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quoteId, customerEmail, customerName, amount, signatureData }: QuoteConfirmationRequest = await req.json();

    // Input validation
    if (!quoteId || !customerEmail || !customerName || amount === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!validateEmail(customerEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!validateAmount(amount)) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Rate limiting
    if (!checkRateLimit(customerEmail)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Sending quote confirmation email for quote:', escapeHtml(quoteId));

    // Escape user input for HTML
    const safeCustomerName = escapeHtml(customerName);
    const safeQuoteId = escapeHtml(quoteId);
    const safeAmount = amount.toFixed(2);

    try {
      const emailResponse = await resend.emails.send({
        from: "Your Service Team <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `Quote Approved - ${safeCustomerName}`,
        html: `
          <h1>Your Quote Has Been Approved!</h1>
          <p>Dear ${safeCustomerName},</p>
          <p>Thank you for signing your quote. Here are the details:</p>
          <ul>
            <li><strong>Quote ID:</strong> ${safeQuoteId}</li>
            <li><strong>Amount:</strong> $${safeAmount}</li>
            <li><strong>Status:</strong> Approved and Signed</li>
          </ul>
          <p>We will contact you soon to schedule the work.</p>
          <p>Best regards,<br>Your Service Team</p>
        `,
      });

      console.log('Email sent successfully:', emailResponse);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully', id: emailResponse.data?.id }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
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
