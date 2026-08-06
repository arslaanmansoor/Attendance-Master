-- ═══════════════════════════════════════════════════════════════
-- ATTENDANCE MASTER — Enhanced Database Schema (v4)
-- Target: Supabase / PostgreSQL
-- Migration: Add missing fields and audit support
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add missing fields to Companies Table ─────────────────────
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS tax_information TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AED',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Dubai',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 2. Add missing fields to Profiles (Employees) Table ───────────
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS passport_id TEXT,
ADD COLUMN IF NOT EXISTS visa_expiry DATE,
ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-time', -- 'Full-time', 'Part-time', 'Contract', 'Intern'
ADD COLUMN IF NOT EXISTS overtime_rate NUMERIC(8, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS working_hours_per_day NUMERIC(4, 2) DEFAULT 8.00,
ADD COLUMN IF NOT EXISTS weekly_off_day TEXT DEFAULT 'Sunday', -- 'Sunday', 'Saturday', 'Friday', etc.
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 3. Add manual override fields to Attendance Logs ─────────────
ALTER TABLE public.attendance_logs
ADD COLUMN IF NOT EXISTS manual_override_total_hours BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_break_hours BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_overtime_hours BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_minutes NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS early_leave_minutes NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 4. Add manual override fields to Payroll Items ───────────────
ALTER TABLE public.payroll_items
ADD COLUMN IF NOT EXISTS commission NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS taxes NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS manual_override_base_salary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_hourly_rate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_overtime_rate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_overtime_hours BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_allowances BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_deductions BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 5. Add audit fields to other tables ───────────────────────────
ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS client TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.holidays
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.payroll_runs
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 6. Create Positions/Job Titles Table ─────────────────────────
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  base_salary_range_min NUMERIC(10, 2) DEFAULT 0.00,
  base_salary_range_max NUMERIC(10, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ── 7. Create Leave Types Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  days_allowed_per_year INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ── 8. Create Leave Balances Table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days NUMERIC(5, 2) DEFAULT 0.00,
  used_days NUMERIC(5, 2) DEFAULT 0.00,
  remaining_days NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- ── 9. Create Settings Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, key)
);

-- ── 10. Create Roles Table for RBAC ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. Add role_id to profiles (optional, for extended RBAC) ──────
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- ── 12. Add manual override to Timesheets (if table exists) ────────
-- Note: Timesheets are stored in attendance_logs, so we already added override fields above

-- ── 13. Create Indexes for New Tables ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_positions_department ON public.positions(department_id);
CREATE INDEX IF NOT EXISTS idx_leave_types_status ON public.leave_types(status);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON public.leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_type ON public.leave_balances(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_settings_company ON public.settings(company_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles(status);

-- ── 14. Enable RLS on New Tables ───────────────────────────────────
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ── 15. RLS Policies for New Tables ────────────────────────────────
-- Positions
CREATE POLICY "Positions viewable by authenticated users" 
  ON public.positions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage positions" 
  ON public.positions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Leave Types
CREATE POLICY "Leave types viewable by authenticated users" 
  ON public.leave_types FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage leave types" 
  ON public.leave_types FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Leave Balances
CREATE POLICY "Employees can view own leave balances" 
  ON public.leave_balances FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all leave balances" 
  ON public.leave_balances FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can manage leave balances" 
  ON public.leave_balances FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Settings
CREATE POLICY "Settings viewable by authenticated users" 
  ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings" 
  ON public.settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Roles
CREATE POLICY "Roles viewable by authenticated users" 
  ON public.roles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage roles" 
  ON public.roles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 16. Seed Initial Data ─────────────────────────────────────────
-- Insert default leave types
INSERT INTO public.leave_types (name, code, description, days_allowed_per_year, is_paid, requires_approval) VALUES
  ('Annual Leave', 'ANNUAL', 'Regular annual vacation days', 30, TRUE, TRUE),
  ('Sick Leave', 'SICK', 'Medical leave with certificate', 15, TRUE, TRUE),
  ('Casual Leave', 'CASUAL', 'Personal or family emergency', 10, TRUE, FALSE),
  ('Maternity Leave', 'MATERNITY', 'Pregnancy and post-natal care', 90, TRUE, TRUE),
  ('Paternity Leave', 'PATERNITY', 'New child care', 5, TRUE, TRUE),
  ('Unpaid Leave', 'UNPAID', 'Leave without pay', 0, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert default positions
INSERT INTO public.positions (title, description, base_salary_range_min, base_salary_range_max) VALUES
  ('Chief Executive Officer', 'Top executive responsible for overall operations', 50000.00, 100000.00),
  ('Chief Financial Officer', 'Head of financial operations', 40000.00, 80000.00),
  ('HR Manager', 'Human resources department head', 25000.00, 50000.00),
  ('Project Manager', 'Manages construction projects', 20000.00, 45000.00),
  ('Site Engineer', 'On-site technical supervisor', 15000.00, 35000.00),
  ('Site Supervisor', 'On-site work supervisor', 12000.00, 25000.00),
  ('Accountant', 'Financial record keeper', 10000.00, 20000.00),
  ('Admin Assistant', 'Administrative support', 8000.00, 15000.00),
  ('Laborer', 'General construction worker', 3000.00, 8000.00),
  ('Driver', 'Vehicle operator', 4000.00, 10000.00)
ON CONFLICT (title) DO NOTHING;

-- Insert default roles with permissions
INSERT INTO public.roles (name, description, permissions) VALUES
  ('Super Admin', 'Full system access', '{"view_all": true, "add_all": true, "edit_all": true, "delete_all": true, "approve_all": true, "export_all": true, "manage_settings": true, "manage_users": true}'::jsonb),
  ('Company Admin', 'Company-level administrator', '{"view_company": true, "add_company": true, "edit_company": true, "view_employees": true, "add_employees": true, "edit_employees": true, "delete_employees": true, "approve_leave": true, "approve_payroll": true, "export_reports": true}'::jsonb),
  ('HR Manager', 'Human resources manager', '{"view_employees": true, "add_employees": true, "edit_employees": true, "view_attendance": true, "manage_leave": true, "approve_leave": true, "export_reports": true}'::jsonb),
  ('Payroll Manager', 'Payroll administrator', '{"view_employees": true, "view_attendance": true, "view_timesheets": true, "generate_payroll": true, "edit_payroll": true, "approve_payroll": true, "export_payroll": true}'::jsonb),
  ('Supervisor', 'Team supervisor', '{"view_team": true, "view_team_attendance": true, "edit_team_attendance": true, "approve_team_leave": true}'::jsonb),
  ('Employee', 'Regular employee', '{"view_own": true, "edit_own_profile": true, "clock_in_out": true, "request_leave": true, "view_own_payroll": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value, description, category) VALUES
  ('working_hours_per_day', '8', 'Standard working hours per day', 'Attendance'),
  ('lunch_break_duration', '1', 'Lunch break duration in hours', 'Attendance'),
  ('overtime_threshold', '8', 'Hours after which overtime begins', 'Attendance'),
  ('overtime_rate_multiplier', '1.25', 'Overtime pay rate multiplier', 'Payroll'),
  ('weekly_off_day', 'Sunday', 'Default weekly off day', 'Attendance'),
  ('currency', 'AED', 'Default currency', 'General'),
  ('timezone', 'Asia/Dubai', 'Default timezone', 'General'),
  ('date_format', 'DD/MM/YYYY', 'Default date format', 'General')
ON CONFLICT (company_id, key) DO NOTHING;
