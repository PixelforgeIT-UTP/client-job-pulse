
import { createClient } from '@supabase/supabase-js';

// Import the constants from the integrations/supabase/client.ts file
import { supabase as supabaseIntegration } from '@/integrations/supabase/client';

// Re-export the existing Supabase client
export const supabase = supabaseIntegration;
