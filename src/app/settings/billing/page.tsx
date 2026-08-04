'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface BillingInfo {
  role: string;
  subscriptionStatus: string;
  statusLabel: string;
  planKey: string | null;
  planName: string;
  hasActiveSubscription: boolean;
  hasStripeCustomer: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  employeeCount: number;
  maxEmployees: number | null;
  payrollEnabled: boolean;
}

export default function BillingSettingsPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    setCheckoutSuccess(new URLSearchParams(window.location.search).get('success') === 'true');

    fetch('/api/billing')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBilling(data);
        }
      })
      .catch(() => setError('Failed to load billing info.'))
      .finally(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    try {
      setPortalLoading(true);
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to open billing portal.');
      }
    } catch {
      alert('Unable to connect to billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'var(--success)';
      case 'past_due':
        return 'var(--warning, #f59e0b)';
      default:
        return 'var(--muted)';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--muted)',
            fontSize: '0.9rem',
            textDecoration: 'none',
            marginBottom: '24px',
          }}
        >
          <ArrowLeft width={16} height={16} /> Back to Dashboard
        </Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Billing & Subscription</h1>
        <p className="muted" style={{ marginBottom: '28px' }}>
          Manage your plan, payment method, and invoices via Stripe.
        </p>

        {checkoutSuccess && (
          <div
            className="card"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              borderColor: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <CheckCircle2 width={20} height={20} style={{ color: 'var(--success)' }} />
            <span>Subscription started successfully. Your 3-day trial is now active.</span>
          </div>
        )}

        {loading && <p className="muted">Loading billing details...</p>}
        {error && <p style={{ color: 'var(--danger, #ef4444)' }}>{error}</p>}

        {billing && !loading && (
          <>
            {billing.subscriptionStatus === 'past_due' && (
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  marginBottom: '20px',
                  borderColor: 'var(--warning, #f59e0b)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <AlertCircle width={20} height={20} style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0 }} />
                <div>
                  <strong>Payment failed</strong>
                  <p className="muted" style={{ margin: '4px 0 0' }}>
                    Update your payment method to restore full access.
                  </p>
                  {billing.hasStripeCustomer && (
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ marginTop: '12px' }}
                      onClick={openPortal}
                      disabled={portalLoading}
                    >
                      Update payment method
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '4px' }}>Current plan</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{billing.planName}</h2>
                </div>
                <span
                  className="badge-chip"
                  style={{
                    background: `${statusColor(billing.subscriptionStatus)}22`,
                    color: statusColor(billing.subscriptionStatus),
                    fontWeight: 600,
                  }}
                >
                  {billing.statusLabel}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '20px',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>Trial ends</p>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>{formatDate(billing.trialEndsAt)}</p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>Next billing date</p>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>{formatDate(billing.currentPeriodEnd)}</p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>Employees</p>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>
                    {billing.employeeCount}
                    {billing.maxEmployees !== null ? ` / ${billing.maxEmployees}` : ' / Unlimited'}
                  </p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>Payroll module</p>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>
                    {billing.payrollEnabled ? 'Included' : 'Not included'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {billing.role === 'admin' && (
                <>
                  {!billing.hasActiveSubscription && (
                    <Link href="/pricing" className="primary-btn" style={{ textDecoration: 'none' }}>
                      <Sparkles width={16} height={16} /> Choose a plan
                    </Link>
                  )}
                  {billing.hasStripeCustomer && (
                    <button
                      type="button"
                      className={billing.hasActiveSubscription ? 'primary-btn' : 'ghost-btn'}
                      onClick={openPortal}
                      disabled={portalLoading}
                    >
                      <CreditCard width={16} height={16} />
                      {portalLoading ? 'Opening portal...' : 'Manage billing'}
                    </button>
                  )}
                  {billing.hasActiveSubscription && (
                    <Link href="/pricing" className="ghost-btn" style={{ textDecoration: 'none' }}>
                      View all plans
                    </Link>
                  )}
                </>
              )}
              {billing.role !== 'admin' && (
                <p className="muted" style={{ fontSize: '0.9rem' }}>
                  Billing is managed by your organization admin.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
