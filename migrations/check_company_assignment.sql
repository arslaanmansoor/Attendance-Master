-- Diagnostic: Check if current user's profile has company_id assigned
-- This will help identify why company fetch is failing

-- Check if companies table exists and has data
SELECT 'companies table count' as check_type, COUNT(*) as result FROM public.companies;

-- Check if profiles have company_id
SELECT 'profiles with company_id' as check_type, COUNT(*) as result 
FROM public.profiles 
WHERE company_id IS NOT NULL;

-- Check if profiles without company_id
SELECT 'profiles without company_id' as check_type, COUNT(*) as result 
FROM public.profiles 
WHERE company_id IS NULL;

-- Show sample profiles with their company_id
SELECT 
    id,
    full_name,
    email,
    company_id,
    department_id
FROM public.profiles 
LIMIT 5;

-- Check foreign key constraints
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as references_table
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'f';
