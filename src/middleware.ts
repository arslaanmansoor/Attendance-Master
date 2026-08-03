import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import {
  hasActiveSubscription,
  isPublicPath,
  isSubscriptionExempt,
  isStripeWebhook,
} from '@/lib/subscription';

async function orgHasActiveSubscription(
  supabase: ReturnType<typeof createClient>['supabase']
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('role', 'admin')
    .in('subscription_status', ['active', 'trialing'])
    .limit(1);

  if (error) {
    console.error('Middleware subscription lookup failed:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStripeWebhook(pathname)) {
    return NextResponse.next();
  }

  try {
    const { supabase, supabaseResponse } = createClient(request);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Middleware auth lookup failed:', userError);
    }

    if (isPublicPath(pathname)) {
      if (user && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return supabaseResponse;
    }

    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isSubscriptionExempt(pathname) || pathname.startsWith('/api/stripe') || pathname.startsWith('/api/billing')) {
      return supabaseResponse;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Middleware profile lookup failed:', profileError);
      return supabaseResponse;
    }

    const isAdmin = profile?.role?.toLowerCase() === 'admin';
    const hasAccess = isAdmin
      ? hasActiveSubscription(profile?.subscription_status)
      : await orgHasActiveSubscription(supabase);

    console.log("===== MIDDLEWARE DEBUG =====");
    console.log("User ID:", user.id);
    console.log("Role:", profile?.role);
    console.log("Subscription Status:", profile?.subscription_status);
    console.log("Has Access:", hasAccess);
    console.log("============================");

    if (!hasAccess) {
      // If user just came back from Stripe checkout with a success param,
      // redirect to /success page instead of /pricing to avoid a loop
      const successParam = request.nextUrl.searchParams.get('success');
      const sessionParam = request.nextUrl.searchParams.get('session_id');
      if (successParam === 'true' || sessionParam) {
        const successUrl = new URL('/success', request.url);
        if (sessionParam) successUrl.searchParams.set('session_id', sessionParam);
        return NextResponse.redirect(successUrl);
      }
      return NextResponse.redirect(new URL('/pricing', request.url));
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware invocation failed:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
