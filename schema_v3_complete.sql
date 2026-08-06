-- ═══════════════════════════════════════════════════════════════
-- ATTENDANCE MASTER — Complete Database Schema (v3)
-- Target: Supabase / PostgreSQL
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Departments Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  punctuality_rate NUMERIC(5, 2) DEFAULT 90.00,
  productivity_rate NUMERIC(5, 2) DEFAULT 85.00,
  status TEXT DEFAULT 'Stable',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Companies Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  trade_license TEXT,
  address TEXT,
  city TEXT DEFAULT 'Dubai',
  country TEXT DEFAULT 'UAE',
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Profiles (Users / Employees) Table ─────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE, -- Custom employee ID like EMP-001
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  position TEXT,
  phone TEXT,
  joining_date DATE,
  basic_salary NUMERIC(10, 2) DEFAULT 0.00,
  hourly_rate NUMERIC(8, 2) DEFAULT 0.00,
  employment_status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'On Leave', 'Terminated'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_price_id TEXT,
  plan_key TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Projects Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  is_critical_path BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active',
  progress NUMERIC(5, 2) DEFAULT 0.00,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Attendance Logs Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day TEXT, -- 'Monday', 'Tuesday', etc.
  time_in TIME,
  time_out TIME,
  break_hours NUMERIC(4, 2) DEFAULT 1.00,
  total_hours NUMERIC(4, 2) DEFAULT 0.00,
  regular_hours NUMERIC(4, 2) DEFAULT 0.00,
  overtime_hours NUMERIC(4, 2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Present', -- 'Present', 'Absent', 'Leave', 'Sick Leave', 'Holiday'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ── 6. Public Holidays Table (UAE) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  is_weekly BOOLEAN DEFAULT FALSE, -- For Sunday weekly holiday
  year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Leave Requests Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. Payroll Runs Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_employees INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. Payroll Items Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  hourly_rate NUMERIC(8, 2) DEFAULT 0.00,
  normal_hours NUMERIC(6, 2) DEFAULT 0.00,
  overtime_hours NUMERIC(6, 2) DEFAULT 0.00,
  overtime_rate NUMERIC(3, 2) DEFAULT 1.25,
  overtime_pay NUMERIC(10, 2) DEFAULT 0.00,
  allowances NUMERIC(10, 2) DEFAULT 0.00,
  bonuses NUMERIC(10, 2) DEFAULT 0.00,
  deductions NUMERIC(10, 2) DEFAULT 0.00,
  advances NUMERIC(10, 2) DEFAULT 0.00,
  leave_deductions NUMERIC(10, 2) DEFAULT 0.00,
  net_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. System Audit Logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexing for High Performance ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_project ON public.attendance_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_run_status ON public.payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_items_run ON public.payroll_items(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);

-- ── Row Level Security (RLS) ──────────────────────────────────
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" 
  ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles" 
  ON public.profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can delete profiles" 
  ON public.profiles FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies: Projects
CREATE POLICY "Projects viewable by authenticated users" 
  ON public.projects FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage projects" 
  ON public.projects FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies: Attendance
CREATE POLICY "Employees can view own attendance or admin views all" 
  ON public.attendance_logs FOR SELECT USING (
    auth.uid() = employee_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Employees can insert own attendance" 
  ON public.attendance_logs FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Admins can update attendance" 
  ON public.attendance_logs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can delete attendance" 
  ON public.attendance_logs FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies: Holidays
CREATE POLICY "Holidays viewable by authenticated users" 
  ON public.holidays FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage holidays" 
  ON public.holidays FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies: Leave Requests
CREATE POLICY "Leave requests viewable by owner or manager" 
  ON public.leave_requests FOR SELECT USING (
    auth.uid() = employee_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Employees can create leave requests" 
  ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Managers can update leave requests" 
  ON public.leave_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies: Payroll
CREATE POLICY "Payroll viewable by authenticated users" 
  ON public.payroll_runs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Payroll items viewable by owner or admin" 
  ON public.payroll_items FOR SELECT USING (
    auth.uid() = employee_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can manage payroll" 
  ON public.payroll_runs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can manage payroll items" 
  ON public.payroll_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ── Initial Seed Data ─────────────────────────────────────────
INSERT INTO public.companies (name, trade_license, address, city, country, phone, email) VALUES
  ('Al-Mansoor Construction LLC', 'TL-987654', 'Dubai Silicon Oasis', 'Dubai', 'UAE', '+971-4-1234567', 'info@almansoor.ae')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.departments (name, code, punctuality_rate, productivity_rate, status) VALUES
  ('Operations', 'OPS', 91.00, 94.00, 'High'),
  ('Engineering', 'ENG', 88.00, 95.00, 'Stable'),
  ('Finance', 'FIN', 85.00, 89.00, 'Watch'),
  ('Product & Design', 'DES', 96.00, 97.00, 'Optimal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.projects (name, code, department_id, status, progress) VALUES
  ('Burj Vista Tower Maintenance', 'PRJ-001', (SELECT id FROM public.departments WHERE code = 'OPS'), 'Active', 65.00),
  ('Dubai Logistics Warehouse B', 'PRJ-002', (SELECT id FROM public.departments WHERE code = 'OPS'), 'Active', 42.00),
  ('Downtown Commercial Plaza', 'PRJ-003', (SELECT id FROM public.departments WHERE code = 'ENG'), 'Active', 78.00),
  ('Sharjah Residential Complex', 'PRJ-004', (SELECT id FROM public.departments WHERE code = 'ENG'), 'Active', 33.00),
  ('Abu Dhabi Marine Terminal', 'PRJ-005', (SELECT id FROM public.departments WHERE code = 'OPS'), 'Active', 15.00)
ON CONFLICT (code) DO NOTHING;

-- Insert UAE Public Holidays for 2026
INSERT INTO public.holidays (name, date, is_weekly, year) VALUES
  ('New Year''s Day', '2026-01-01', FALSE, 2026),
  ('Eid al-Fitr', '2026-03-30', FALSE, 2026),
  ('Eid al-Fitr Holiday 2', '2026-03-31', FALSE, 2026),
  ('Eid al-Fitr Holiday 3', '2026-04-01', FALSE, 2026),
  ('Arafat', '2026-06-06', FALSE, 2026),
  ('Eid al-Adha', '2026-06-07', FALSE, 2026),
  ('Eid al-Adha Holiday 2', '2026-06-08', FALSE, 2026),
  ('Eid al-Adha Holiday 3', '2026-06-09', FALSE, 2026),
  ('Islamic New Year', '2026-07-26', FALSE, 2026),
  ('Prophet Muhammad''s Birthday', '2026-11-04', FALSE, 2026),
  ('National Day', '2026-12-02', FALSE, 2026),
  ('National Day Holiday 2', '2026-12-03', FALSE, 2026)
ON CONFLICT (date) DO NOTHING;
