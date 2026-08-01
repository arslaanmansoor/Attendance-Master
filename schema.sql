-- ═══════════════════════════════════════════════════════════════
-- ATTENDANCE MASTER — Database Schema & Row Level Security (RLS)
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
  status TEXT DEFAULT 'Stable', -- 'High', 'Stable', 'Watch', 'Optimal'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Profiles (Users / Employees) Table ─────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee', -- 'admin', 'manager', 'employee'
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position TEXT,
  phone TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive', -- 'active', 'past_due', 'canceled', 'inactive'
  subscription_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Attendance Logs Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present', -- 'present', 'late', 'absent', 'on_leave', 'half_day'
  overtime_hours NUMERIC(4, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ── 4. Leave Requests Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL, -- 'Vacation', 'Sick leave', 'Personal', 'Parental'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Review', 'Rejected'
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Payroll Summary & Items Table ──────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL, -- e.g., 'August 2026 Cycle 1'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Processing', 'Approved', 'Disbursed'
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  overtime_pay NUMERIC(10, 2) DEFAULT 0.00,
  deductions NUMERIC(10, 2) DEFAULT 0.00,
  net_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Projects Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_critical_path BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active', -- 'Active', 'Completed', 'On Hold'
  progress NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. System Audit Logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  category TEXT DEFAULT 'General', -- 'Payroll', 'Attendance', 'Leave', 'System'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexing for High Performance ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_run_status ON public.payroll_runs(status);

-- ── Row Level Security (RLS) ──────────────────────────────────
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" 
  ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: Attendance
CREATE POLICY "Employees can view own attendance or admin views all" 
  ON public.attendance_logs FOR SELECT USING (
    auth.uid() = employee_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Employees can insert own attendance check-in" 
  ON public.attendance_logs FOR INSERT WITH CHECK (auth.uid() = employee_id);

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

-- ── Initial Seed Data ─────────────────────────────────────────
INSERT INTO public.departments (name, code, punctuality_rate, productivity_rate, status) VALUES
  ('Operations', 'OPS', 91.00, 94.00, 'High'),
  ('Engineering', 'ENG', 88.00, 95.00, 'Stable'),
  ('Finance', 'FIN', 85.00, 89.00, 'Watch'),
  ('Product & Design', 'DES', 96.00, 97.00, 'Optimal')
ON CONFLICT (name) DO NOTHING;
