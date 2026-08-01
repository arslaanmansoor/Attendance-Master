import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getPlanDisplayName,
  getPlanKeyFromPriceId,
  getPlanLimits,
  hasActiveSubscription,
  statusLabel,
} from '@/lib/subscription';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'role, subscription_status, subscription_price_id, plan_key, stripe_customer_id, trial_ends_at, current_period_end'
      )
      .eq('id', user.id)
      .single();

    const planKey =
      (profile?.plan_key as ReturnType<typeof getPlanKeyFromPriceId>) ??
      getPlanKeyFromPriceId(profile?.subscription_price_id);

    const { count: employeeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee');

    const limits = getPlanLimits(planKey);

    return NextResponse.json({
      role: profile?.role ?? 'employee',
      subscriptionStatus: profile?.subscription_status ?? 'inactive',
      statusLabel: statusLabel(profile?.subscription_status),
      planKey,
      planName: getPlanDisplayName(planKey),
      hasActiveSubscription: hasActiveSubscription(profile?.subscription_status),
      hasStripeCustomer: Boolean(profile?.stripe_customer_id),
      trialEndsAt: profile?.trial_ends_at,
      currentPeriodEnd: profile?.current_period_end,
      employeeCount: employeeCount ?? 0,
      maxEmployees: limits.maxEmployees === Infinity ? null : limits.maxEmployees,
      payrollEnabled: limits.payroll,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
