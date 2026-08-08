-- Diagnostic: Check what tables and columns actually exist in your database
-- Run this first to understand your current schema

-- List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if profiles table exists and its columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any table that might be related to companies
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (table_name LIKE '%company%' OR table_name LIKE '%org%');

-- Check for any table that might be related to departments
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (table_name LIKE '%department%' OR table_name LIKE '%dept%');
