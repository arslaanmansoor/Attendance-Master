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
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('role', 'admin')
    .in('subscription_status', ['active', 'trialing'])
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStripeWebhook(pathname)) {
    return NextResponse.next();
  }

  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

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

  if (isSubscriptionExempt(pathname) || pathname.startsWith('/api/stripe')) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_status')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const hasAccess = isAdmin
    ? hasActiveSubscription(profile?.subscription_status)
    : await orgHasActiveSubscription(supabase);

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
