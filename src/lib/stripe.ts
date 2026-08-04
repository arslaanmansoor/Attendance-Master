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
  FREE_TRIAL: {
    name: 'Free Trial',
    priceId: 'free_trial',
    amount: 0,
    billingLabel: '3 days free',
    description: '3 Days full access trial. No credit card required.',
    trialDays: 3,
  },
  PRO: {
    name: 'Pro Plan',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    amount: 80,
    billingLabel: '/ 1 month',
    description: 'USD $80/month — Full attendance, timesheets & standard exports',
    trialDays: 0,
  },
  PREMIUM: {
    name: 'Premium Plan',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_6month',
    amount: 400,
    billingLabel: '/ 6 months',
    description: 'USD $400/6 months — Complete payroll, multi-project & UAE compliance tracking',
    trialDays: 0,
  },
  PLATINUM: {
    name: 'Platinum Plan',
    priceId: process.env.STRIPE_PLATINUM_PRICE_ID || 'price_platinum_yearly',
    amount: 700,
    billingLabel: '/ 12 months',
    description: 'USD $700/12 months — Multi-company enterprise suite, unlimited projects & SLA support',
    trialDays: 0,
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
