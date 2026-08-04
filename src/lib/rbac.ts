// ══════════════════════════════════════════════════════════════
// RBAC — Role-Based Access Control Helpers
// ══════════════════════════════════════════════════════════════

import { type Role, ROLE_HIERARCHY } from '@/lib/types/database';

/**
 * Check if the user's role has at least the required access level.
 */
export function hasMinRole(userRole: string | undefined | null, requiredRole: Role): boolean {
  const role = (userRole ?? 'employee') as Role;
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

/**
 * Check if user can manage employees (HR and above).
 */
export function canManageEmployees(role: string | undefined | null): boolean {
  return hasMinRole(role, 'hr');
}

/**
 * Check if user can manage payroll (Accountant and above).
 */
export function canManagePayroll(role: string | undefined | null): boolean {
  return hasMinRole(role, 'accountant');
}

/**
 * Check if user can manage timesheets (Supervisor and above).
 */
export function canManageTimesheets(role: string | undefined | null): boolean {
  return hasMinRole(role, 'supervisor');
}

/**
 * Check if user can manage company settings (Company Admin and above).
 */
export function canManageCompany(role: string | undefined | null): boolean {
  return hasMinRole(role, 'company_admin');
}

/**
 * Check if user is a Super Admin.
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return hasMinRole(role, 'super_admin');
}

/**
 * Check if user can view reports.
 */
export function canViewReports(role: string | undefined | null): boolean {
  return hasMinRole(role, 'supervisor');
}

/**
 * Returns the display name for a role.
 */
export function roleDisplayName(role: string | undefined | null): string {
  const labels: Record<Role, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    hr: 'HR',
    accountant: 'Accountant',
    supervisor: 'Supervisor',
    employee: 'Employee',
  };
  return labels[(role ?? 'employee') as Role] ?? 'Employee';
}

/**
 * All available roles for dropdown selects, ordered by hierarchy.
 */
export const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'employee', label: 'Employee (View Only)' },
];
