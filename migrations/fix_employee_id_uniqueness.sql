-- Migration: Fix employee_id uniqueness to be per-company instead of global
-- This allows different companies to use the same employee IDs (e.g., EMP-001)
-- while preventing duplicates within the same company

-- Step 1: Drop the existing global unique constraint on employee_id
-- First, we need to find the constraint name
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%employee_id%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No employee_id constraint found to drop';
    END IF;
END $$;

-- Step 2: Add a composite unique constraint on (company_id, employee_id)
-- This allows NULL company_id (for admins without companies) but ensures uniqueness when company_id is set
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_company_id_employee_id_key 
UNIQUE (company_id, employee_id);

-- Step 3: Create a partial unique index for records without company_id (optional)
-- This ensures that if multiple employees have no company_id, their employee_ids are still unique
CREATE UNIQUE INDEX IF NOT EXISTS profiles_employee_id_no_company_idx 
ON public.profiles (employee_id) 
WHERE company_id IS NULL;

-- Migration complete
-- Now employee_id is unique per company, not globally
