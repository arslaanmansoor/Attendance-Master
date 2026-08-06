import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanKeyFromPriceId, getPlanLimits } from '@/lib/subscription';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['employee', 'manager']);

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('plan_key, subscription_price_id')
      .eq('role', 'admin')
      .in('subscription_status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    const planKey =
      (adminProfile?.plan_key as ReturnType<typeof getPlanKeyFromPriceId>) ??
      getPlanKeyFromPriceId(adminProfile?.subscription_price_id);

    const limits = getPlanLimits(planKey);

    return NextResponse.json({
      count: count ?? 0,
      maxEmployees: limits.maxEmployees === Infinity ? null : limits.maxEmployees,
      planKey,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, email, role, department_id, position } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('plan_key, subscription_price_id, subscription_status')
      .eq('role', 'admin')
      .in('subscription_status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    const planKey =
      (adminProfile?.plan_key as ReturnType<typeof getPlanKeyFromPriceId>) ??
      getPlanKeyFromPriceId(adminProfile?.subscription_price_id);

    const limits = getPlanLimits(planKey);

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['employee', 'manager']);

    if (count !== null && count >= limits.maxEmployees) {
      return NextResponse.json(
        {
          error: `Plan limit reached (${limits.maxEmployees} employees). Upgrade your plan to add more.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee slot available. Complete invite flow via Supabase Auth admin.',
      employee: { full_name, email, role: role ?? 'employee', department_id, position },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
