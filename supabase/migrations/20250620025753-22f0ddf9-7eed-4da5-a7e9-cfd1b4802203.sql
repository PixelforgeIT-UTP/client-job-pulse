
-- Add workflow fields to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS job_date DATE;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS supervisor_notes TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Update quotes status default to use workflow
ALTER TABLE public.quotes ALTER COLUMN status SET DEFAULT 'pending_supervisor_approval';

-- Enable RLS on quotes table
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Techs can view quotes they created, supervisors/admins can view all
CREATE POLICY "Techs can view their quotes, supervisors can view all" 
  ON public.quotes 
  FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
  );

-- Policy: Only techs can create quotes
CREATE POLICY "Techs can create quotes" 
  ON public.quotes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tech')
  );

-- Policy: Techs can update their own pending quotes, supervisors can update pending_supervisor_approval quotes, techs can add signatures to pending_client_signature quotes
CREATE POLICY "Quote update workflow" 
  ON public.quotes 
  FOR UPDATE 
  USING (
    (created_by = auth.uid() AND status = 'pending_supervisor_approval') OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')) AND status = 'pending_supervisor_approval') OR
    (created_by = auth.uid() AND status = 'pending_client_signature')
  );

-- Policy: Only admins can delete quotes
CREATE POLICY "Admins can delete quotes" 
  ON public.quotes 
  FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create a function to automatically create job when quote is approved
CREATE OR REPLACE FUNCTION public.create_job_from_quote()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create job when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.jobs (
      title,
      client_id,
      scheduled_at,
      status,
      cost,
      notes,
      created_by
    ) VALUES (
      'Job for ' || NEW.client_name,
      NULL, -- We'll need to create or find client
      NEW.job_date::timestamp with time zone,
      'scheduled',
      NEW.amount,
      'Generated from quote #' || NEW.id,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for job creation from quotes
CREATE TRIGGER create_job_on_quote_approval
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_job_from_quote();
