-- ═══════════════════════════════════════════════════════════════
-- ATTENDANCE MASTER v2 — Comprehensive Database Schema
-- Multi-Tenant (Companies/Projects), UAE Expiry Tracking, Manual Daily Timesheets, 
-- Configurable Payroll, Audit Logs, & Notifications
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Companies Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trade_license_no TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default Demo Company
INSERT INTO public.companies (id, name, trade_license_no, address)
VALUES ('11111111-1111-1111-1111-111111111111', 'Al-Mansoor Construction LLC', 'TL-987654', 'Dubai Silicon Oasis, UAE')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Site Locations Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_locations (id, company_id, name, address) VALUES
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Downtown Dubai Site A', 'Downtown Dubai, Plot 14'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Dubai South Logistics Hub', 'Dubai South Near Expo')
ON CONFLICT (id) DO NOTHING;

-- ── 3. Company Settings (Configurable Rules) ────────────────
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  standard_working_hours NUMERIC(4,2) DEFAULT 9.00,
  default_break_hours NUMERIC(4,2) DEFAULT 1.00,
  regular_hours_cap NUMERIC(4,2) DEFAULT 8.00,
  overtime_rate_weekday NUMERIC(4,2) DEFAULT 1.25,
  overtime_rate_weekend NUMERIC(4,2) DEFAULT 1.50,
  weekly_holiday_day TEXT DEFAULT 'Sunday',
  uae_labour_law_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.company_settings (company_id)
VALUES ('11111111-1111-1111-1111-111111111111')
ON CONFLICT (company_id) DO NOTHING;

-- ── 4. Departments, Designations, Employee Categories ───────
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.designations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. 'Site Worker', 'Engineer', 'Management'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Projects Table (Extended) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  site_location_id UUID REFERENCES public.site_locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  is_critical_path BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active', -- 'Active', 'Completed', 'On Hold'
  progress NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.projects (id, company_id, site_location_id, name, code, status, progress) VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Burj Vista Tower Maintenance', 'PRJ-101', 'Active', 65.00),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Dubai Logistics Warehouse B', 'PRJ-102', 'Active', 40.00)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Profiles Table (Extended with Expiries & Payroll Data) ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  employee_id_code TEXT, -- e.g. EMP-001
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee', -- 'super_admin', 'company_admin', 'hr', 'accountant', 'supervisor', 'employee'
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  site_location_id UUID REFERENCES public.site_locations(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.employee_categories(id) ON DELETE SET NULL,
  position TEXT,
  phone TEXT,
  -- UAE Compliance Documents & Dates
  visa_expiry DATE,
  emirates_id_expiry DATE,
  passport_expiry DATE,
  labour_card_expiry DATE,
  contract_expiry DATE,
  passport_no TEXT,
  emirates_id_no TEXT,
  labour_card_no TEXT,
  document_urls JSONB DEFAULT '[]'::jsonb,
  qr_code_token TEXT,
  -- Salary Setup
  monthly_salary NUMERIC(10,2) DEFAULT 0.00,
  basic_salary NUMERIC(10,2) DEFAULT 0.00,
  hourly_rate NUMERIC(8,2) DEFAULT 0.00,
  normal_working_hours NUMERIC(5,2) DEFAULT 208.00, -- 26 days * 8h
  overtime_rate_override NUMERIC(4,2),
  allowances NUMERIC(10,2) DEFAULT 0.00,
  deductions NUMERIC(10,2) DEFAULT 0.00,
  -- Stripe Subscription Data
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing', -- 'active', 'trialing', 'past_due', 'canceled', 'inactive'
  subscription_price_id TEXT,
  plan_key TEXT DEFAULT 'FREE_TRIAL',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Public Holidays Calendar Table ─────────────────────────
CREATE TABLE IF NOT EXISTS public.public_holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  title TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, holiday_date)
);

-- ── 8. Redesigned Daily Timesheets Table ───────────────────────
CREATE TABLE IF NOT EXISTS public.timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  time_in TIME,
  time_out TIME,
  break_hours NUMERIC(4,2) DEFAULT 1.00,
  total_hours NUMERIC(4,2) DEFAULT 0.00,
  regular_hours NUMERIC(4,2) DEFAULT 0.00,
  overtime_hours NUMERIC(4,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Present', -- 'Present', 'Absent', 'Leave', 'Sick Leave', 'Holiday'
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ── 9. Payroll Runs & Payslips ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., 'Payroll August 2026'
  month INT NOT NULL,
  year INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_basic NUMERIC(12,2) DEFAULT 0.00,
  total_overtime NUMERIC(12,2) DEFAULT 0.00,
  total_allowances NUMERIC(12,2) DEFAULT 0.00,
  total_deductions NUMERIC(12,2) DEFAULT 0.00,
  total_net NUMERIC(12,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Approved', 'Disbursed'
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_salary NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  basic_salary NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  hourly_rate NUMERIC(8,2) NOT NULL DEFAULT 0.00,
  normal_working_hours NUMERIC(6,2) DEFAULT 0.00,
  worked_regular_hours NUMERIC(6,2) DEFAULT 0.00,
  overtime_hours NUMERIC(6,2) DEFAULT 0.00,
  overtime_rate NUMERIC(6,2) DEFAULT 1.25,
  overtime_pay NUMERIC(10,2) DEFAULT 0.00,
  allowances NUMERIC(10,2) DEFAULT 0.00,
  deductions NUMERIC(10,2) DEFAULT 0.00,
  advances NUMERIC(10,2) DEFAULT 0.00,
  leave_deductions NUMERIC(10,2) DEFAULT 0.00,
  net_salary NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. Notifications Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'visa_expiry', 'emirates_id_expiry', 'passport_expiry', 'labour_card_expiry', 'trial_expiry', 'subscription_expiry', 'payroll_ready', 'public_holiday'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. System Audit Logs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_timesheets_emp_date ON public.timesheets(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_payslips_run_emp ON public.payslips(payroll_run_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
