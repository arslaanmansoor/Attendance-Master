'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Sparkles } from 'lucide-react';

interface BillingSummary {
  subscriptionStatus: string;
  planName: string;
  trialEndsAt: string | null;
  role: string;
  hasActiveSubscription: boolean;
}

export function SubscriptionBanner() {
  const [billing, setBilling] = useState<BillingSummary | null>(null);

  useEffect(() => {
    fetch('/api/billing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setBilling(data))
      .catch(() => {});
  }, []);

  if (!billing) return null;

  const { subscriptionStatus, trialEndsAt, role, hasActiveSubscription } = billing;

  if (subscriptionStatus === 'past_due') {
    return (
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle width={18} height={18} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.9rem' }}>
            Your payment failed. Update your payment method to avoid losing access.
          </span>
        </div>
        {role === 'admin' && (
          <Link href="/settings/billing" className="primary-btn" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            Update payment
          </Link>
        )}
      </div>
    );
  }

  if (subscriptionStatus === 'trialing' && trialEndsAt) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    return (
      <div
        style={{
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles width={18} height={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.9rem' }}>
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial on {billing.planName}.
          </span>
        </div>
        {role === 'admin' && (
          <Link href="/settings/billing" className="ghost-btn" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            Manage billing
          </Link>
        )}
      </div>
    );
  }

  if (role === 'admin' && !hasActiveSubscription) {
    return (
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>No active subscription. Subscribe to unlock all features.</span>
        <Link href="/pricing" className="primary-btn" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
          View plans
        </Link>
      </div>
    );
  }

  return null;
}
