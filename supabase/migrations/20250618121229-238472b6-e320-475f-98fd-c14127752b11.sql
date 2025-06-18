
-- Create the photo_approval_requests table
CREATE TABLE public.photo_approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Add Row Level Security
ALTER TABLE public.photo_approval_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view requests they created or if they're admin
CREATE POLICY "Users can view their own photo requests or admins can view all" 
  ON public.photo_approval_requests 
  FOR SELECT 
  USING (
    employee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Users can create their own photo requests
CREATE POLICY "Users can create their own photo requests" 
  ON public.photo_approval_requests 
  FOR INSERT 
  WITH CHECK (employee_id = auth.uid());

-- Policy: Only admins can update photo requests (approve/reject)
CREATE POLICY "Admins can update photo requests" 
  ON public.photo_approval_requests 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create the job-photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;
