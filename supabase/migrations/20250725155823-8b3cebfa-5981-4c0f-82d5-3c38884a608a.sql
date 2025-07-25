-- Fix RLS policies to ensure users only see their own data

-- Remove overly permissive policies for quotes
DROP POLICY IF EXISTS "Allow read/write for authenticated" ON public.quotes;

-- Create proper quote access policies
CREATE POLICY "Users can view their own quotes or supervisors can view all" ON public.quotes
  FOR SELECT USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
  );

CREATE POLICY "Users can create their own quotes" ON public.quotes
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own quotes or supervisors can update pending ones" ON public.quotes
  FOR UPDATE USING (
    (created_by = auth.uid() AND status IN ('draft', 'pending_client_signature')) OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')) AND status = 'pending_supervisor_approval')
  );

-- Remove overly permissive policies for invoices  
DROP POLICY IF EXISTS "Authenticated can access all invoices" ON public.invoices;

-- Create proper invoice access policies
CREATE POLICY "Users can view their own invoices or supervisors can view all" ON public.invoices
  FOR SELECT USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
  );

CREATE POLICY "Users can create their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own invoices or supervisors can update pending ones" ON public.invoices
  FOR UPDATE USING (
    (created_by = auth.uid() AND status IN ('draft', 'pending_client_signature')) OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')) AND status = 'pending_supervisor_approval')
  );

-- Remove overly permissive policies for jobs
DROP POLICY IF EXISTS "Authenticated can access all jobs" ON public.jobs;

-- Update job policies to be more restrictive
DROP POLICY IF EXISTS "Users can view assigned jobs or admins can view all" ON public.jobs;

CREATE POLICY "Users can view their assigned jobs or admins can view all" ON public.jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_assignments WHERE job_assignments.job_id = jobs.id AND job_assignments.user_id = auth.uid()) OR
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create time tracking table with proper RLS
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time entries or admins can view all" ON public.time_entries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create their own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time entries" ON public.time_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries" ON public.time_entries
  FOR DELETE USING (user_id = auth.uid());

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  push_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());