-- Migration: Create companies table and add foreign key constraints
-- This fixes the missing companies table and relationship errors

-- Step 1: Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Add company_id column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'company_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_id UUID;
        RAISE NOTICE 'Added company_id column to profiles table';
    ELSE
        RAISE NOTICE 'company_id column already exists in profiles table';
    END IF;
END $$;

-- Step 3: Create a default company if none exists
INSERT INTO public.companies (name)
SELECT 'Default Company'
WHERE NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1);

-- Step 4: Update profiles without company_id to use the default company
UPDATE public.profiles
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;

-- Step 5: Add foreign key constraint for profiles.company_id → companies.id
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%company%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_company_id_fkey
FOREIGN KEY (company_id)
REFERENCES public.companies(id)
ON DELETE SET NULL;

-- Step 6: Add foreign key constraint for profiles.department_id → departments.id
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%department%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_department_id_fkey
FOREIGN KEY (department_id)
REFERENCES public.departments(id)
ON DELETE SET NULL;

-- Step 7: Verify the constraints were added
DO $$
DECLARE
    company_fk_exists boolean;
    department_fk_exists boolean;
    company_count integer;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
        AND conname = 'profiles_company_id_fkey'
    ) INTO company_fk_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
        AND conname = 'profiles_department_id_fkey'
    ) INTO department_fk_exists;
    
    SELECT COUNT(*) INTO company_count FROM public.companies;
    
    IF company_fk_exists AND department_fk_exists THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraints added. Companies count: %', company_count;
    ELSE
        RAISE EXCEPTION 'FAILURE: One or more foreign key constraints were not added. company_fk: %, department_fk: %', company_fk_exists, department_fk_exists;
    END IF;
END $$;
