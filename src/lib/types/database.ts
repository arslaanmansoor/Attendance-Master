// ══════════════════════════════════════════════════════════════
// Attendance Master v2 — Comprehensive TypeScript Database Types
// ══════════════════════════════════════════════════════════════

// ── Enum Types ────────────────────────────────────────────────

export type Role =
  | 'super_admin'
  | 'company_admin'
  | 'hr'
  | 'accountant'
  | 'supervisor'
  | 'employee';

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  company_admin: 80,
  hr: 60,
  accountant: 50,
  supervisor: 40,
  employee: 10,
};

export type TimesheetStatus = 'Present' | 'Absent' | 'Leave' | 'Sick Leave' | 'Holiday';

export type LeaveStatus = 'Pending' | 'Approved' | 'Review' | 'Rejected';

export type PayrollRunStatus = 'Draft' | 'Approved' | 'Disbursed';

export type PayslipStatus = 'Pending' | 'Paid';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'inactive';

export type PlanKey = 'FREE_TRIAL' | 'PRO' | 'PREMIUM' | 'PLATINUM';

// ── Table Interfaces ──────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  trade_license_no?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteLocation {
  id: string;
  company_id: string;
  name: string;
  address?: string;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  company_id: string;
  standard_working_hours: number;
  default_break_hours: number;
  regular_hours_cap: number;
  overtime_rate_weekday: number;
  overtime_rate_weekend: number;
  weekly_holiday_day: string;
  uae_labour_law_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id?: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Designation {
  id: string;
  company_id?: string;
  title: string;
  created_at: string;
}

export interface EmployeeCategory {
  id: string;
  company_id?: string;
  name: string;
  created_at: string;
}

export interface Project {
  id: string;
  company_id?: string;
  site_location_id?: string;
  name: string;
  code?: string;
  is_critical_path: boolean;
  status: 'Active' | 'Completed' | 'On Hold';
  progress: number;
  created_at: string;
  // Joined
  site_location?: SiteLocation;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  employee_id_code?: string;
  avatar_url?: string;
  role: Role;
  company_id?: string;
  site_location_id?: string;
  department_id?: string;
  designation_id?: string;
  category_id?: string;
  position?: string;
  phone?: string;
  // UAE Compliance Documents
  visa_expiry?: string;
  emirates_id_expiry?: string;
  passport_expiry?: string;
  labour_card_expiry?: string;
  contract_expiry?: string;
  passport_no?: string;
  emirates_id_no?: string;
  labour_card_no?: string;
  document_urls?: string[];
  qr_code_token?: string;
  // Salary Setup
  monthly_salary: number;
  basic_salary: number;
  hourly_rate: number;
  normal_working_hours: number;
  overtime_rate_override?: number;
  allowances: number;
  deductions: number;
  // Stripe Subscription
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: SubscriptionStatus;
  subscription_price_id?: string;
  plan_key: PlanKey;
  trial_ends_at?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
  // Joined
  department?: Department;
  designation?: Designation;
  company?: Company;
}

export interface PublicHoliday {
  id: string;
  company_id?: string;
  holiday_date: string;
  title: string;
  is_recurring: boolean;
  created_at: string;
}

export interface TimesheetRecord {
  id: string;
  company_id?: string;
  employee_id: string;
  project_id?: string;
  date: string;
  day_of_week: string;
  time_in?: string;
  time_out?: string;
  break_hours: number;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: TimesheetStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: Profile;
  project?: Project;
}

export interface PayrollRun {
  id: string;
  company_id?: string;
  title: string;
  month: number;
  year: number;
  period_start: string;
  period_end: string;
  total_basic: number;
  total_overtime: number;
  total_allowances: number;
  total_deductions: number;
  total_net: number;
  status: PayrollRunStatus;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Joined
  payslips?: Payslip[];
}

export interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  monthly_salary: number;
  basic_salary: number;
  hourly_rate: number;
  normal_working_hours: number;
  worked_regular_hours: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  allowances: number;
  deductions: number;
  advances: number;
  leave_deductions: number;
  net_salary: number;
  status: PayslipStatus;
  created_at: string;
  // Joined
  employee?: Profile;
  payroll_run?: PayrollRun;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: LeaveStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: Profile;
}

export interface Notification {
  id: string;
  company_id?: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface SystemActivity {
  id: string;
  company_id?: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  category: string;
  created_at: string;
}

// ── Helper Types ──────────────────────────────────────────────

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  totalOvertimeHours: number;
  totalPayroll: number;
  activeProjects: number;
  expiringDocuments: number;
  trialRemainingDays: number | null;
  subscriptionStatus: SubscriptionStatus;
}

export interface ExpiringDocument {
  employeeId: string;
  employeeName: string;
  documentType: string;
  expiryDate: string;
  daysRemaining: number;
}
