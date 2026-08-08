-- Migration: Add missing foreign key constraints for Supabase/PostgREST relationships
-- This fixes the "Could not find a relationship" error by adding proper FK constraints
-- Safe migration: Uses IF NOT EXISTS and ON DELETE SET NULL to avoid breaking existing data

-- Step 1: Verify tables exist (this will fail if tables don't exist, preventing accidental execution)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'companies table does not exist. Cannot add foreign keys.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'profiles table does not exist. Cannot add foreign keys.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'departments table does not exist. Cannot add foreign keys.';
  END IF;
END $$;

-- Step 2: Check if columns exist in profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_id' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'profiles.company_id column does not exist. Cannot add foreign key.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'profiles.department_id column does not exist. Cannot add foreign key.';
  END IF;
END $$;

-- Step 3: Clean up orphaned records before adding constraints
-- Remove profiles.company_id values that don't reference valid companies
UPDATE public.profiles
SET company_id = NULL
WHERE company_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.companies WHERE id = profiles.company_id);

-- Remove profiles.department_id values that don't reference valid departments
UPDATE public.profiles
SET department_id = NULL
WHERE department_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.departments WHERE id = profiles.department_id);

-- Step 4: Add foreign key constraint for profiles.company_id → companies.id
-- First, drop any existing constraint with a similar name to avoid conflicts
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
        RAISE NOTICE 'Dropped existing company constraint: %', constraint_name;
    END IF;
END $$;

-- Add the proper foreign key constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_company_id_fkey
FOREIGN KEY (company_id)
REFERENCES public.companies(id)
ON DELETE SET NULL;

-- Step 5: Add foreign key constraint for profiles.department_id → departments.id
-- First, drop any existing constraint with a similar name to avoid conflicts
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
        RAISE NOTICE 'Dropped existing department constraint: %', constraint_name;
    END IF;
END $$;

-- Add the proper foreign key constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_department_id_fkey
FOREIGN KEY (department_id)
REFERENCES public.departments(id)
ON DELETE SET NULL;

-- Step 6: Verify the constraints were added
DO $$
DECLARE
    company_fk_exists boolean;
    department_fk_exists boolean;
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
    
    IF company_fk_exists AND department_fk_exists THEN
        RAISE NOTICE 'SUCCESS: Both foreign key constraints added successfully.';
    ELSE
        RAISE EXCEPTION 'FAILURE: One or more foreign key constraints were not added. company_fk: %, department_fk: %', company_fk_exists, department_fk_exists;
    END IF;
END $$;

-- Migration complete
