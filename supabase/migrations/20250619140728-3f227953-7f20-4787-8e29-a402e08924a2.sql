
-- Add a junction table for job assignments since jobs can be assigned to multiple users
CREATE TABLE public.job_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(job_id, user_id)
);

-- Add Row Level Security
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view assignments for jobs they're assigned to or admins can view all
CREATE POLICY "Users can view their job assignments or admins can view all" 
  ON public.job_assignments 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Only admins can create job assignments
CREATE POLICY "Admins can create job assignments" 
  ON public.job_assignments 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Only admins can update job assignments
CREATE POLICY "Admins can update job assignments" 
  ON public.job_assignments 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Only admins can delete job assignments
CREATE POLICY "Admins can delete job assignments" 
  ON public.job_assignments 
  FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update jobs table RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;

-- Add RLS to jobs table if not already enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view jobs they're assigned to or admins can view all
CREATE POLICY "Users can view assigned jobs or admins can view all" 
  ON public.jobs 
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.job_assignments WHERE job_id = jobs.id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Only admins can create jobs
CREATE POLICY "Admins can create jobs" 
  ON public.jobs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Only admins can update jobs
CREATE POLICY "Admins can update jobs" 
  ON public.jobs 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Only admins can delete jobs
CREATE POLICY "Admins can delete jobs" 
  ON public.jobs 
  FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
