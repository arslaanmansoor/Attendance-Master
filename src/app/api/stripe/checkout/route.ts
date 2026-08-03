import { NextResponse } from 'next/server';
import { stripe, getPlan, type PlanKey } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasActiveSubscription } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planKey } = body as { planKey?: string };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Please log in to subscribe.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User profile not found.' }, { status: 404 });
    }

    if (hasActiveSubscription(profile.subscription_status)) {
      return NextResponse.json(
        { success: false, error: 'You already have an active subscription. Use Manage Billing to change plans.' },
        { status: 400 }
      );
    }

    const resolvedPlanKey = (planKey ?? 'PRO') as PlanKey;
    const plan = getPlan(resolvedPlanKey);
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      ...(profile.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email }),
      subscription_data: {
        trial_period_days: plan.trialDays || 3,
        metadata: {
          plan_key: resolvedPlanKey,
          supabase_user_id: user.id,
        },
      },
      metadata: {
        plan_key: resolvedPlanKey,
        supabase_user_id: user.id,
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
    });

    // Immediately mark subscription as trialing so user can access dashboard
    // Use admin client to bypass RLS and ensure the update always succeeds
    const adminSupabase = createAdminClient();
    await adminSupabase
      .from('profiles')
      .update({
        subscription_status: 'trialing',
        plan_key: resolvedPlanKey,
        stripe_customer_id: session.customer as string || profile.stripe_customer_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: unknown) {
    console.error('Checkout error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
