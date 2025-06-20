
-- Add customer information fields to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS job_date DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_supervisor_approval';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS supervisor_notes TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies for the new workflow
DROP POLICY IF EXISTS "Users can view their job assignments or admins can view all" ON public.invoices;
DROP POLICY IF EXISTS "Admins can create job assignments" ON public.invoices;
DROP POLICY IF EXISTS "Admins can update job assignments" ON public.invoices;
DROP POLICY IF EXISTS "Admins can delete job assignments" ON public.invoices;

-- Enable RLS on invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Techs can view invoices they created, supervisors/admins can view all
CREATE POLICY "Techs can view their invoices, supervisors can view all" 
  ON public.invoices 
  FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
  );

-- Policy: Only techs can create invoices
CREATE POLICY "Techs can create invoices" 
  ON public.invoices 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tech')
  );

-- Policy: Techs can update their own pending invoices, supervisors can update pending_supervisor_approval invoices, techs can add signatures to pending_client_signature invoices
CREATE POLICY "Invoice update workflow" 
  ON public.invoices 
  FOR UPDATE 
  USING (
    (created_by = auth.uid() AND status = 'pending_supervisor_approval') OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')) AND status = 'pending_supervisor_approval') OR
    (created_by = auth.uid() AND status = 'pending_client_signature')
  );

-- Policy: Only admins can delete invoices
CREATE POLICY "Admins can delete invoices" 
  ON public.invoices 
  FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create a function to automatically create job when invoice is approved
CREATE OR REPLACE FUNCTION public.create_job_from_invoice()
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
      'Job for ' || NEW.customer_name,
      NULL, -- We'll need to create or find client
      NEW.job_date::timestamp with time zone,
      'scheduled',
      NEW.amount,
      'Generated from invoice #' || NEW.id,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for job creation
CREATE TRIGGER create_job_on_invoice_approval
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.create_job_from_invoice();
