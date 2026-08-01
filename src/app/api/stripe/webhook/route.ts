import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanByPriceId } from '@/lib/stripe';
import Stripe from 'stripe';

type ProfileUpdate = Record<string, string | null>;

async function updateProfileByCustomer(customerId: string, updates: ProfileUpdate) {
  const supabase = createAdminClient();
  await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', customerId);
}

async function updateProfileByUserId(userId: string, updates: ProfileUpdate) {
  const supabase = createAdminClient();
  await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    default:
      return 'inactive';
  }
}

function subscriptionUpdates(subscription: Stripe.Subscription): ProfileUpdate {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const planKey = priceId ? getPlanByPriceId(priceId) : null;

  return {
    stripe_subscription_id: subscription.id,
    subscription_status: mapSubscriptionStatus(subscription.status),
    subscription_price_id: priceId,
    plan_key: planKey,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== 'whsec_placeholder') {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook Signature Verification Failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;
      const userId = session.metadata?.supabase_user_id;
      const planKey = session.metadata?.plan_key ?? null;

      let updates: ProfileUpdate = {
        stripe_customer_id: customerId,
        subscription_status: 'trialing',
        plan_key: planKey,
      };

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        updates = { ...updates, ...subscriptionUpdates(subscription) };
      }

      if (userId) {
        await updateProfileByUserId(userId, updates);
      } else if (session.customer_email && customerId) {
        const supabase = createAdminClient();
        await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('email', session.customer_email);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateProfileByCustomer(subscription.customer as string, subscriptionUpdates(subscription));
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateProfileByCustomer(subscription.customer as string, {
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        subscription_price_id: null,
        plan_key: null,
        trial_ends_at: null,
        current_period_end: null,
      });
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer) {
        await updateProfileByCustomer(invoice.customer as string, {
          subscription_status: 'past_due',
        });
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer && invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        await updateProfileByCustomer(invoice.customer as string, subscriptionUpdates(subscription));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
