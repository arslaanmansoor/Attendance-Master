-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Add missing subscription columns to profiles table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Add missing columns (safe to run multiple times with IF NOT EXISTS pattern)
DO $$
BEGIN
  -- plan_key: stores the plan tier (PRO, PREMIUM, PLATINUM)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan_key'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN plan_key TEXT;
  END IF;

  -- stripe_subscription_id: Stripe subscription reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- trial_ends_at: trial expiry timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;

  -- current_period_end: billing period end timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN current_period_end TIMESTAMPTZ;
  END IF;
END $$;

-- Ensure service role can update all profiles (for webhook updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Service role can update all profiles'
  ) THEN
    CREATE POLICY "Service role can update all profiles"
      ON public.profiles FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
