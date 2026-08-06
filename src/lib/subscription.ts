export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'inactive';

export const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'trialing'];

export type PlanKey = 'FREE_TRIAL' | 'PRO' | 'PREMIUM' | 'PLATINUM';

export const PLAN_NAMES: Record<PlanKey, string> = {
  FREE_TRIAL: 'Free Trial',
  PRO: 'Pro Plan',
  PREMIUM: 'Premium Plan',
  PLATINUM: 'Platinum Plan',
};

export const PLAN_LIMITS: Record<PlanKey, { maxEmployees: number; payroll: boolean }> = {
  FREE_TRIAL: { maxEmployees: Infinity, payroll: true },
  PRO: { maxEmployees: 50, payroll: false },
  PREMIUM: { maxEmployees: 250, payroll: true },
  PLATINUM: { maxEmployees: Infinity, payroll: true },
};

export function hasActiveSubscription(status?: string | null): boolean {
  return ACTIVE_STATUSES.includes((status ?? 'inactive') as SubscriptionStatus);
}

export function getPlanKeyFromPriceId(priceId?: string | null): PlanKey | null {
  if (!priceId) return null;
  if (priceId.includes('pro')) return 'PRO';
  if (priceId.includes('premium')) return 'PREMIUM';
  if (priceId.includes('platinum')) return 'PLATINUM';
  return null;
}

export function getPlanLimits(planKey?: PlanKey | null) {
  if (!planKey) return PLAN_LIMITS.PRO;
  return PLAN_LIMITS[planKey] ?? PLAN_LIMITS.PRO;
}

export function getPlanDisplayName(planKey?: PlanKey | null, priceId?: string | null): string {
  if (planKey) return PLAN_NAMES[planKey] ?? 'Unknown plan';
  if (priceId) return 'Active Stripe subscription';
  return 'No plan';
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

export const PUBLIC_PATHS = ['/login', '/register', '/pricing', '/success'];
export const SUBSCRIPTION_EXEMPT_PATHS = ['/pricing', '/settings/billing', '/success'];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isSubscriptionExempt(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isStripeWebhook(pathname: string): boolean {
  return pathname.startsWith('/api/stripe/webhook');
}
