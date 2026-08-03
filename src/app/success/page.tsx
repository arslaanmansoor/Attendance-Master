'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Suspense } from 'react';

type ActivationState = 'verifying' | 'activated' | 'delayed';

function SuccessPageContent() {
  const [state, setState] = useState<ActivationState>('verifying');
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const pollCount = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }

    const checkSubscription = async (): Promise<boolean> => {
      try {
        const res = await fetch('/api/billing');
        if (!res.ok) return false;
        const data = await res.json();
        return data.hasActiveSubscription === true;
      } catch {
        return false;
      }
    };

    const poll = async () => {
      const isActive = await checkSubscription();

      if (isActive) {
        setState('activated');
        setTimeout(() => {
          router.replace('/');
        }, 2000);
        return;
      }

      pollCount.current += 1;

      if (pollCount.current >= 6) {
        setState('delayed');
        return;
      }

      setTimeout(poll, 1000);
    };

    poll();
  }, [sessionId, router]);

  const handleGoToDashboard = () => {
    router.replace('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '48px 36px',
          textAlign: 'center',
        }}
      >
        {state === 'verifying' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <Loader2
                width={32}
                height={32}
                style={{
                  color: 'var(--primary)',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
              Activating your subscription...
            </h1>
            <p className="muted" style={{ fontSize: '0.95rem' }}>
              We&apos;re confirming your payment with Stripe. This usually takes a few seconds.
            </p>
          </>
        )}

        {state === 'activated' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircle2
                width={32}
                height={32}
                style={{ color: 'var(--success)' }}
              />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
              You&apos;re all set!
            </h1>
            <p className="muted" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
              Your subscription is active. Redirecting you to the dashboard...
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--success)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Sparkles width={14} height={14} /> Free trial started
            </div>
          </>
        )}

        {state === 'delayed' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircle2
                width={32}
                height={32}
                style={{ color: '#f59e0b' }}
              />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
              Payment received!
            </h1>
            <p className="muted" style={{ fontSize: '0.95rem', marginBottom: '24px' }}>
              Your payment was successful. Subscription activation may take a moment to process.
              You can proceed to the dashboard now.
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={handleGoToDashboard}
              style={{
                width: '100%',
                padding: '14px',
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Go to Dashboard <ArrowRight width={16} height={16} />
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader2
            width={32}
            height={32}
            style={{
              color: 'var(--primary)',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
