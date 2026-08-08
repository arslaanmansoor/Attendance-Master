-- Migration: Add RLS policies to companies table
-- This fixes the "Failed to load company" error caused by RLS being enabled without policies

-- Enable RLS on companies table (if not already enabled)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update companies" ON public.companies;

-- Policy: Authenticated users can view companies they belong to
CREATE POLICY "Users can view companies"
ON public.companies
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = companies.id
  )
);

-- Policy: Service role can bypass RLS (for admin operations)
CREATE POLICY "Service role can manage companies"
ON public.companies
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Verify policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'companies';
