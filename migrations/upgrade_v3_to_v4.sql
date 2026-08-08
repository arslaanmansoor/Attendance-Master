-- Migration: Upgrade from v3 to v4 schema
-- This script adds new fields to existing tables for enhanced functionality
-- Run this after applying schema_v3_complete.sql if you want the v4 enhancements

-- Add new fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS passport_id TEXT,
ADD COLUMN IF NOT EXISTS visa_expiry DATE,
ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS overtime_rate NUMERIC DEFAULT 1.25,
ADD COLUMN IF NOT EXISTS working_hours_per_day NUMERIC DEFAULT 9,
ADD COLUMN IF NOT EXISTS weekly_off_day TEXT DEFAULT 'Sunday',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS trade_license_expiry DATE,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to attendance_logs table
ALTER TABLE public.attendance_logs
ADD COLUMN IF NOT EXISTS total_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS regular_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS break_hours NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS day TEXT,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to payroll_items table
ALTER TABLE public.payroll_items
ADD COLUMN IF NOT EXISTS overtime_rate NUMERIC DEFAULT 1.25,
ADD COLUMN IF NOT EXISTS overtime_pay NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS leave_deductions NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to departments table
ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS budget NUMERIC,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS budget NUMERIC,
ADD COLUMN IF NOT EXISTS actual_cost NUMERIC,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to holidays table
ALTER TABLE public.holidays
ADD COLUMN IF NOT EXISTS is_weekly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to leave_requests table
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add new fields to payroll_runs table
ALTER TABLE public.payroll_runs
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Create new tables if they don't exist

-- Positions table
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  base_salary_range_min NUMERIC,
  base_salary_range_max NUMERIC,
  hourly_rate NUMERIC,
  description TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Leave types table
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  days_allowed INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days INTEGER DEFAULT 0,
  used_days INTEGER DEFAULT 0,
  remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[], -- Array of permission strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
CREATE POLICY "Positions viewable by authenticated users" 
  ON public.positions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage positions" 
  ON public.positions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Leave types viewable by authenticated users" 
  ON public.leave_types FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage leave types" 
  ON public.leave_types FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users can view own leave balances" 
  ON public.leave_balances FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Admins can manage leave balances" 
  ON public.leave_balances FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Settings viewable by authenticated users" 
  ON public.settings FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (is_public = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

CREATE POLICY "Admins can manage settings" 
  ON public.settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Roles viewable by authenticated users" 
  ON public.roles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage roles" 
  ON public.roles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Seed data for leave types
INSERT INTO public.leave_types (name, code, days_allowed, is_paid, requires_approval, description) VALUES
  ('Annual Leave', 'ANNUAL', 30, true, true, 'Regular annual vacation leave'),
  ('Sick Leave', 'SICK', 15, true, true, 'Medical leave for illness'),
  ('Unpaid Leave', 'UNPAID', 0, false, true, 'Leave without pay'),
  ('Maternity Leave', 'MATERNITY', 90, true, true, 'Maternity/paternity leave'),
  ('Emergency Leave', 'EMERGENCY', 3, true, false, 'Emergency personal leave')
ON CONFLICT (code) DO NOTHING;

-- Seed data for roles
INSERT INTO public.roles (name, description, permissions) VALUES
  ('Admin', 'Full system access', ARRAY['*']),
  ('Manager', 'Manage employees, attendance, payroll', ARRAY['employees:read', 'employees:write', 'attendance:read', 'attendance:write', 'payroll:read', 'payroll:write', 'reports:read']),
  ('Employee', 'View own data, clock in/out', ARRAY['own:attendance:write', 'own:attendance:read', 'own:profile:read'])
ON CONFLICT (name) DO NOTHING;

-- Seed data for settings
INSERT INTO public.settings (key, value, description, category, is_public) VALUES
  ('company_name', 'Al-Mansoor Construction LLC', 'Company name for reports', 'company', true),
  ('working_hours_per_day', '9', 'Standard working hours per day', 'attendance', true),
  ('overtime_rate', '1.25', 'Overtime multiplier', 'payroll', false),
  ('currency', 'AED', 'Currency for payroll', 'payroll', true),
  ('default_break_hours', '1', 'Default break hours per day', 'attendance', false)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_date ON public.attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_project_id ON public.attendance_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_run_id ON public.payroll_items(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_date ON public.leave_requests(employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON public.leave_balances(employee_id, year);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'updated_at') THEN
    CREATE TRIGGER IF NOT EXISTS update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_logs' AND column_name = 'updated_at') THEN
    CREATE TRIGGER IF NOT EXISTS update_attendance_logs_updated_at BEFORE UPDATE ON public.attendance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Migration complete
