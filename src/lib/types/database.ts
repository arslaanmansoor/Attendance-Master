export type Role = 'admin' | 'manager' | 'employee';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'on_leave' | 'half_day';
export type LeaveStatus = 'Pending' | 'Approved' | 'Review' | 'Rejected';
export type DepartmentStatus = 'High' | 'Stable' | 'Watch' | 'Optimal';

export interface Department {
  id: string;
  name: string;
  code: string;
  punctuality_rate: number;
  productivity_rate: number;
  status: DepartmentStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role;
  department_id?: string;
  position?: string;
  phone?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
  subscription_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
  overtime_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
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
  profile?: Profile;
}

export interface PayrollRun {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: 'Draft' | 'Processing' | 'Approved' | 'Disbursed';
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemActivity {
  id: string;
  user_id?: string;
  action: string;
  details?: string;
  category: string;
  created_at: string;
}
