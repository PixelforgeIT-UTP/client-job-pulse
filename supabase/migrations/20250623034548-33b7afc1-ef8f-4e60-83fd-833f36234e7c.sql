
-- Create customers table if it doesn't exist (using clients table structure)
-- This will store customer information from quotes

-- Add a customer_id field to quotes table to link to the client
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.clients(id);

-- Create a storage bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile images
CREATE POLICY "Users can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profiles' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add avatar_url to profiles table for storing profile image URLs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
