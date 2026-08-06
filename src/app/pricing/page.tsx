'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const handleBackClick = () => {
    if (isAuthenticated) {
      router.push('/');
    } else {
      router.push('/login');
    }
  };

  const handleSubscribe = async (planKey: string) => {
    try {
      setLoadingPlan(planKey);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to start checkout. Check your Stripe keys in .env.local.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Unable to connect to checkout service.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      key: 'PRO',
      name: 'Pro Plan',
      tagline: 'Ideal for growing teams needing essential attendance & shift management.',
      price: 80,
      billingLabel: '/ month',
      badge: 'Popular for SMBs',
      features: [
        'Up to 50 active employees',
        'Real-time check-in/out tracking',
        'Basic leave request workflows',
        'Weekly & monthly CSV exports',
        'Standard email support (24h SLA)',
      ],
    },
    {
      key: 'PREMIUM',
      name: 'Premium Plan',
      tagline: 'Comprehensive suite for scaling workforce ops, automated payroll & audit logs.',
      price: 400,
      billingLabel: 'every 6 months',
      badge: 'Most Popular',
      featured: true,
      features: [
        'Up to 250 active employees',
        'Automated payroll calculation & exports',
        'Advanced attendance trend analytics',
        'Custom approval workflows & notifications',
        'Stripe billing & customer portal access',
        'Priority support (4h SLA)',
      ],
    },
    {
      key: 'PLATINUM',
      name: 'Platinum Plan',
      tagline: 'Enterprise-grade capacity with dedicated account management & custom SLA.',
      price: 700,
      billingLabel: '/ year',
      badge: 'Enterprise',
      features: [
        'Unlimited employees & departments',
        'Full Supabase database direct sync',
        'Custom department pulse & KPI builders',
        'Audit logs & regulatory compliance history',
        'Dedicated account manager & 1-on-1 onboarding',
        '99.99% Uptime Guarantee & Custom SLA',
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={handleBackClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none',
              marginBottom: '20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'color var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <ArrowLeft width={16} height={16} /> Back to {isAuthenticated ? 'Dashboard' : 'Login'}
          </button>

          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'var(--primary-soft)', marginBottom: '16px' }}>
              <Sparkles width={16} height={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>3-Day Free Trial on Any Plan</span>
            </div>
            <p className="eyebrow" style={{ letterSpacing: '0.2em' }}>Flexible SaaS Plans</p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.03em' }}>
              Simple, transparent pricing for modern HR teams.
            </h1>
            <p className="muted" style={{ fontSize: '1.05rem', marginTop: '12px' }}>
              Start with a 3-day free trial. No credit card required. Pro is billed monthly, Premium every 6 months, and Platinum annually. Cancel or upgrade anytime via Stripe Customer Portal.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '40px',
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="card"
              style={{
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.featured ? '2px solid var(--primary)' : '1px solid var(--border)',
                boxShadow: plan.featured ? '0 20px 45px rgba(37, 99, 235, 0.18)' : 'var(--shadow)',
              }}
            >
              {plan.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 16px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles width={14} height={14} /> Most Popular
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{plan.name}</h3>
                  <span className="badge-chip info">{plan.badge}</span>
                </div>
            <p className="muted" style={{ fontSize: '0.88rem', marginTop: '8px', minHeight: '40px' }}>
                  {plan.tagline}
                </p>
              </div>

              <div style={{ margin: '24px 0', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '2.8rem', fontWeight: 800 }}>${plan.price}</span>
                  <span className="muted" style={{ fontSize: '0.9rem' }}>{plan.billingLabel}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>✓ 3-day free trial included</div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem' }}>
                    <Check width={18} height={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={plan.featured ? 'primary-btn' : 'btn-secondary'}
                style={{ width: '100%', marginTop: '32px', padding: '12px', justifyContent: 'center' }}
                onClick={() => handleSubscribe(plan.key)}
                disabled={loadingPlan === plan.key}
              >
                {loadingPlan === plan.key ? 'Starting Free Trial...' : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: '56px', padding: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Frequently Asked Questions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Can I switch plans later?</strong>
              <p className="muted" style={{ marginTop: '4px' }}>
                Yes, you can upgrade or downgrade your plan anytime directly from the Stripe Customer Portal.
              </p>
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Is there a free trial?</strong>
              <p className="muted" style={{ marginTop: '4px' }}>
                Every plan comes with a 3-day free trial. Access all premium features risk-free. You won&apos;t be charged until your trial ends.
              </p>
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>What payment methods are supported?</strong>
              <p className="muted" style={{ marginTop: '4px' }}>
                We process payments via Stripe, supporting Visa, Mastercard, American Express, Apple Pay, and Google Pay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
