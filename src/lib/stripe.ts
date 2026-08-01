import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
  appInfo: {
    name: 'Attendance Master',
    version: '1.0.0',
  },
});

export type PlanKey = keyof typeof PLANS;

export const PLANS = {
  PRO: {
    name: 'Pro Plan',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    amount: 49,
    billingLabel: '/ month',
    description: 'Up to 50 employees, automated attendance tracking & exports',
  },
  PREMIUM: {
    name: 'Premium Plan',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_6month',
    amount: 149,
    billingLabel: 'every 6 months',
    description: 'Up to 250 employees, payroll sync, advanced analytics & audit logs',
  },
  PLATINUM: {
    name: 'Platinum Plan',
    priceId: process.env.STRIPE_PLATINUM_PRICE_ID || 'price_platinum_yearly',
    amount: 399,
    billingLabel: '/ year',
    description: 'Unlimited employees, dedicated support, custom integrations & SLA',
  },
} as const;

export function getPlan(planKey: string) {
  return PLANS[planKey as PlanKey] ?? PLANS.PRO;
}

export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]) {
    if (plan.priceId === priceId) return key;
  }
  return null;
}
