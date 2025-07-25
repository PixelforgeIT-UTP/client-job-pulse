-- Security Fix Migration: Enable RLS and fix database functions

-- 1. Enable RLS on missing tables and add policies
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_log (admins can view all, users can view their own actions)
CREATE POLICY "Admins can view all audit logs" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view their own audit logs" ON public.audit_log
  FOR SELECT USING (actor_id = auth.uid());

-- RLS Policies for invoice_items (based on invoice ownership)
CREATE POLICY "Users can view invoice items for their invoices" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND (invoices.created_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')))
    )
  );

CREATE POLICY "Users can create invoice items for their invoices" ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update invoice items for their invoices" ON public.invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete invoice items" ON public.invoice_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for job_items (based on job ownership)
CREATE POLICY "Users can view job items for assigned jobs" ON public.job_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_items.job_id 
      AND (EXISTS (SELECT 1 FROM job_assignments WHERE job_assignments.job_id = jobs.id AND job_assignments.user_id = auth.uid()) OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Admins can manage job items" ON public.job_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Fix database functions - Update all functions to be secure
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  current_user_role text;
  target_user_current_role text;
  admin_count integer;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  
  -- Check if the calling user is an admin
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Get target user's current role
  SELECT role INTO target_user_current_role FROM public.profiles WHERE id = target_user_id;
  
  -- Prevent last admin from being demoted
  IF target_user_current_role = 'admin' AND new_role != 'admin' THEN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last admin user';
    END IF;
  END IF;

  -- Prevent self-demotion from admin
  IF auth.uid() = target_user_id AND current_user_role = 'admin' AND new_role != 'admin' THEN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote yourself as the last admin';
    END IF;
  END IF;

  -- Update the user's role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log the role change
  INSERT INTO public.audit_log (table_name, record_id, action, actor_id)
  VALUES ('profiles', target_user_id, 'ROLE_CHANGE_TO_' || new_role, auth.uid());
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_job_from_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
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
      NEW.customer_id,
      NEW.job_date::timestamp with time zone,
      'scheduled',
      NEW.amount,
      'Generated from quote #' || NEW.id,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_job_from_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
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
      NULL,
      NEW.job_date::timestamp with time zone,
      'scheduled',
      NEW.amount,
      'Generated from invoice #' || NEW.id,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS TABLE(full_name text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT profiles.full_name, profiles.role
  FROM public.profiles
  WHERE profiles.id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
  ELSIF (TG_OP = 'UPDATE') THEN
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.jwt_custom_claims()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  select jsonb_build_object(
    'role', role
  )
  from public.profiles
  where id = auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.audit_log (table_name, record_id, action, actor_id)
  VALUES (TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP, auth.uid());
  RETURN NEW;
END;
$function$;