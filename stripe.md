# Stripe Integration for Attendance Master

## Overview
This project uses Stripe checkout sessions and webhooks to manage subscription plans for admin users. It supports:
- Stripe checkout for plan selection
- 14-day trial subscriptions
- Billing portal access
- Stripe webhook event handling for subscription and invoice updates

## Required Stripe Account Setup
1. Create a Stripe account at https://dashboard.stripe.com/register.
2. In the Stripe Dashboard, go to `Developers > API keys`.
   - Copy the `Publishable key`.
   - Copy the `Secret key`.
3. In `Developers > Webhooks`, create a new webhook endpoint:
   - Click `Add endpoint`.
   - Enter the endpoint URL:
     - `https://<your-domain>/api/stripe/webhook` for production
     - `http://localhost:3000/api/stripe/webhook` for local development
   - Choose the latest API version supported by your Stripe account.
   - Subscribe to these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
   - Save the endpoint.
   - Copy the webhook `Signing secret` and paste it into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
   - If you use Stripe CLI for local development, run:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
     Then copy the CLI signing secret and set it in `.env.local` as well.

## Project Environment Variables
Update `.env.local` with your Stripe keys and plan price IDs.

Required variables:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_PREMIUM_PRICE_ID`
- `STRIPE_PLATINUM_PRICE_ID`
- `NEXT_PUBLIC_APP_URL`

Example:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_1ProYourPriceId
STRIPE_PREMIUM_PRICE_ID=price_1PremiumYourPriceId
STRIPE_PLATINUM_PRICE_ID=price_1PlatinumYourPriceId
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Stripe Price IDs and Plans
The app expects three plan price IDs in the environment:
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_PREMIUM_PRICE_ID`
- `STRIPE_PLATINUM_PRICE_ID`

These map to the plan definitions in `src/lib/stripe.ts`.

### Plan configuration in `src/lib/stripe.ts`
- `PRO` uses `STRIPE_PRO_PRICE_ID`
- `PREMIUM` uses `STRIPE_PREMIUM_PRICE_ID`
- `PLATINUM` uses `STRIPE_PLATINUM_PRICE_ID`

## Checkout Flow
### Route: `src/app/api/stripe/checkout/route.ts`
- Validates that the current user is signed in and is an admin.
- Prevents checkout if an active subscription already exists.
- Creates a Stripe Checkout Session with:
  - `mode: 'subscription'`
  - `line_items: [{ price: plan.priceId, quantity: 1 }]`
  - `trial_period_days: 14`
  - `metadata` containing `plan_key` and `supabase_user_id`
  - `success_url`: `${origin}/settings/billing?success=true`
  - `cancel_url`: `${origin}/pricing?canceled=true`

## Billing Portal
Billing portal sessions are created in `src/app/api/stripe/portal/route.ts`.
The portal returns a URL to Stripe's hosted billing management experience.

## Webhook Handling
### Route: `src/app/api/stripe/webhook/route.ts`
This endpoint receives Stripe webhook events and updates Supabase `profiles` records.

Supported events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

### How it updates user records
- Uses `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` to verify payloads.
- Maps Stripe subscription state to the app’s `subscription_status` values.
- Stores the Stripe subscription price ID and plan key.
- Updates `trial_ends_at` and `current_period_end`.
- Syncs records using `stripe_customer_id` or email lookup if needed.

## Testing Locally
1. Start the app locally:
```bash
npm run dev
```
2. Use Stripe CLI to forward webhook events to local development:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
3. Copy the webhook signing secret from Stripe CLI and add it to `.env.local`.

## Notes
- `STRIPE_WEBHOOK_SECRET` should be the webhook signing secret, not the API key.
- Keep `STRIPE_SECRET_KEY` private.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe to expose in the browser.
- The webhook endpoint uses `process.env.STRIPE_WEBHOOK_SECRET` to validate Stripe requests.

## Useful Stripe Dashboard Paths
- API keys: https://dashboard.stripe.com/test/apikeys
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Prices: https://dashboard.stripe.com/test/products
