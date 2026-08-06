import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const getSupabaseConfig = () => {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  let url = 'https://placeholder.supabase.co';
  if (rawUrl) {
    try {
      url = new URL(rawUrl).toString();
    } catch {
      url = 'https://placeholder.supabase.co';
    }
  }

  const key = rawKey || 'placeholder-key';
  return { url, key };
};

export const createClient = (request: NextRequest) => {
  const { url, key } = getSupabaseConfig();

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  return { supabase, supabaseResponse };
};
