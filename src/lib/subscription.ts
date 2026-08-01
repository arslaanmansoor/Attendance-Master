import { PLANS, type PlanKey } from './stripe';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'inactive';

export const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'trialing'];

export const PLAN_LIMITS: Record<PlanKey, { maxEmployees: number; payroll: boolean }> = {
  PRO: { maxEmployees: 50, payroll: false },
  PREMIUM: { maxEmployees: 250, payroll: true },
  PLATINUM: { maxEmployees: Infinity, payroll: true },
};

export function hasActiveSubscription(status?: string | null): boolean {
  return ACTIVE_STATUSES.includes((status ?? 'inactive') as SubscriptionStatus);
}

export function getPlanKeyFromPriceId(priceId?: string | null): PlanKey | null {
  if (!priceId) return null;
  for (const [key, plan] of Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]) {
    if (plan.priceId === priceId) return key;
  }
  return null;
}

export function getPlanLimits(planKey?: PlanKey | null) {
  if (!planKey) return PLAN_LIMITS.PRO;
  return PLAN_LIMITS[planKey] ?? PLAN_LIMITS.PRO;
}

export function getPlanDisplayName(planKey?: PlanKey | null): string {
  if (!planKey) return 'No plan';
  return PLANS[planKey]?.name ?? 'Unknown plan';
}

export function statusLabel(status?: string | null): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Past due';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Inactive';
  }
}

export const PUBLIC_PATHS = ['/login', '/register', '/pricing'];
export const SUBSCRIPTION_EXEMPT_PATHS = ['/pricing', '/settings/billing'];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isSubscriptionExempt(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isStripeWebhook(pathname: string): boolean {
  return pathname.startsWith('/api/stripe/webhook');
}
