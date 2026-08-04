'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import {
  Users,
  CalendarCheck,
  Clock,
  DollarSign,
  Search,
  Bell,
  Sun,
  Moon,
  TrendingUp,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Download,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  ChevronRight,
  X,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

type RangeKey = '7d' | '30d' | '90d';

const chartDatasets: Record<RangeKey, { label: string; value: number; onTime: number }[]> = {
  '7d': [
    { label: 'Mon', value: 72, onTime: 68 },
    { label: 'Tue', value: 76, onTime: 71 },
    { label: 'Wed', value: 74, onTime: 70 },
    { label: 'Thu', value: 79, onTime: 75 },
    { label: 'Fri', value: 81, onTime: 78 },
    { label: 'Sat', value: 84, onTime: 80 },
    { label: 'Sun', value: 88, onTime: 85 },
  ],
  '30d': [
    { label: 'W1', value: 68, onTime: 64 },
    { label: 'W2', value: 72, onTime: 69 },
    { label: 'W3', value: 76, onTime: 72 },
    { label: 'W4', value: 80, onTime: 77 },
    { label: 'W5', value: 85, onTime: 81 },
    { label: 'W6', value: 88, onTime: 84 },
    { label: 'W7', value: 91, onTime: 87 },
  ],
  '90d': [
    { label: 'M1-1', value: 60, onTime: 55 },
    { label: 'M1-2', value: 66, onTime: 62 },
    { label: 'M2-1', value: 72, onTime: 68 },
    { label: 'M2-2', value: 77, onTime: 73 },
    { label: 'M3-1', value: 84, onTime: 80 },
    { label: 'M3-2', value: 90, onTime: 86 },
    { label: 'M3-3', value: 94, onTime: 91 },
  ],
};

interface LeaveRequest {
  id: string;
  employee: string;
  avatar: string;
  type: string;
  dates: string;
  status: 'Approved' | 'Pending' | 'Review';
}

interface BillingSummary {
  role: string;
  subscriptionStatus: string;
  statusLabel: string;
  planKey: string | null;
  planName: string;
  subscriptionPriceId: string | null;
  hasActiveSubscription: boolean;
  hasStripeCustomer: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  employeeCount: number;
  maxEmployees: number | null;
  payrollEnabled: boolean;
}

interface DashboardPlan {
  key: string;
  name: string;
  tagline: string;
  priceLabel: string;
  badge: string;
  features: string[];
}

const dashboardPlans: DashboardPlan[] = [
  {
    key: 'PRO',
    name: 'Pro Plan',
    tagline: 'Essential workforce tracking for growing teams.',
    priceLabel: '$49 / month',
    badge: 'Popular for SMBs',
    features: ['Up to 50 employees', 'Basic attendance analytics', 'CSV exports', 'Standard email support'],
  },
  {
    key: 'PREMIUM',
    name: 'Premium Plan',
    tagline: 'Advanced automation and payroll for scaling organizations.',
    priceLabel: '$149 every 6 months',
    badge: 'Most Popular',
    features: ['Up to 250 employees', 'Payroll & audit logs', 'Advanced analytics', 'Priority support'],
  },
  {
    key: 'PLATINUM',
    name: 'Platinum Plan',
    tagline: 'Enterprise-grade capacity with dedicated support.',
    priceLabel: '$399 / year',
    badge: 'Enterprise',
    features: ['Unlimited employees', 'Custom integrations', 'Dedicated account team', 'SLA & uptime commitment'],
  },
];

const initialLeaveRequests: LeaveRequest[] = [
  { id: '1', employee: 'Alicia Chen', avatar: 'AC', type: 'Vacation', dates: 'Aug 14–18', status: 'Approved' },
  { id: '2', employee: 'Marcus Lee', avatar: 'ML', type: 'Sick leave', dates: 'Aug 17', status: 'Pending' },
  { id: '3', employee: 'Diana Ortiz', avatar: 'DO', type: 'Personal', dates: 'Aug 21–22', status: 'Review' },
  { id: '4', employee: 'James Taylor', avatar: 'JT', type: 'Parental Leave', dates: 'Sep 01–15', status: 'Pending' },
];

export default function DashboardPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [range, setRange] = useState<RangeKey>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const router = useRouter();

  // Initialize theme, auth state, and billing data
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }

    const supabase = createClient();

    const initAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setAuthUser(data.user ?? null);
      setAuthLoading(false);

      if (data.user) {
        fetch('/api/billing')
          .then((res) => res.json())
          .then((data) => {
            if (!data.error) {
              setBilling(data);
            }
          })
          .catch(() => {
            // Ignore billing failures to keep dashboard functional
          });
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetch('/api/billing')
          .then((res) => res.json())
          .then((data) => {
            if (!data.error) {
              setBilling(data);
            }
          })
          .catch(() => { });
      } else {
        setBilling(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace('/login');
    }
  }, [authLoading, authUser, router]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const triggerToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  if (authLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-panel" style={{ width: '100%' }}>
          <div className="card auth-card" style={{ textAlign: 'center' }}>
            <div className="auth-brand" style={{ justifyContent: 'center' }}>
              <div className="auth-logo">
                <span>AM</span>
              </div>
              <div>
                <h2>Preparing your workspace</h2>
                <p className="muted">Checking authentication and billing state…</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  const handleSelectPlan = async (planKey: string) => {
    if (!authUser) {
      router.push('/login');
      return;
    }

    if (billing?.role !== 'admin') {
      triggerToast('Only admin users can start Stripe checkout. Please use an admin account.');
      return;
    }

    setLoadingPlan(planKey);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        triggerToast(data.error || 'Unable to start checkout.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      triggerToast('Unable to connect to billing checkout.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleStatusChange = (id: string, newStatus: 'Approved' | 'Pending' | 'Review') => {
    setLeaveRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    triggerToast(`Updated leave request status to ${newStatus}`);
  };

  // SVG Chart calculation
  const chartPoints = useMemo(() => {
    const points = chartDatasets[range].map((d) => d.value);
    const width = 560;
    const height = 260;
    const padding = 28;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const stepX = (width - padding * 2) / (points.length - 1);

    const coords = points.map((val, idx) => {
      const x = padding + idx * stepX;
      const normalized = (val - min) / (max - min || 1);
      const y = height - padding - normalized * (height - padding * 2);
      return { x, y, val };
    });

    const pathData = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaData = `${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    return { coords, pathData, areaData, width, height, padding };
  }, [range]);

  const filteredLeaveRequests = useMemo(() => {
    if (!searchQuery.trim()) return leaveRequests;
    const q = searchQuery.toLowerCase();
    return leaveRequests.filter(
      (r) =>
        r.employee.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [leaveRequests, searchQuery]);

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--surface)',
            color: 'var(--text)',
            padding: '12px 20px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles width={18} height={18} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{notificationMsg}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" style={{ background: '#000', border: '2px solid #D4AF37' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" stroke="#D4AF37" strokeWidth="1.5" />
              <text x="12" y="16" textAnchor="middle" fill="#D4AF37" fontSize="10" fontWeight="bold" fontFamily="serif">AM</text>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Attendance Master</div>
            <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>HR OS</div>
          </div>
        </div>

        <nav className="nav-group" aria-label="Sidebar navigation">
          {[
            { name: 'Dashboard', icon: Layers, badge: 'Live', href: '/' },
            { name: 'Employees', icon: Users, href: '/employees' },
            { name: 'Attendance', icon: CalendarCheck, badge: '12', href: '/' },
            { name: 'Payroll', icon: DollarSign, href: '/payroll' },
            { name: 'Projects', icon: Briefcase, href: '/' },
            { name: 'Reports', icon: FileText, href: '/' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <Link
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                href={item.href}
                onClick={() => setActiveTab(item.name)}
              >
                <span className="lead">
                  <Icon width={18} height={18} style={{ opacity: isActive ? 1 : 0.7 }} />
                  <span>{item.name}</span>
                </span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-card" style={{ marginTop: 'auto' }}>
          <div className="pill">● Premium plan</div>
          <h4 style={{ margin: '10px 0 6px', fontWeight: 600 }}>Operations synced</h4>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            Stay ahead of absences, payouts, and approvals in one place.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-panel">
        {/* Topbar */}
        <header className="topbar">
          <label className="search" aria-label="Global search">
            <Search width={18} height={18} style={{ color: 'var(--muted)' }} />
            <input
              type="search"
              placeholder="Search employees, teams, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <div className="topbar-actions">
            <button
              className="ghost-btn"
              type="button"
              onClick={() => triggerToast('System Health: All services operational (99.99%)')}
            >
              System Live
            </button>

            <button
              className="icon-btn"
              type="button"
              aria-label="Notifications"
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              style={{ position: 'relative' }}
            >
              <Bell width={18} height={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                }}
              />
            </button>

            <button
              className="icon-btn"
              type="button"
              aria-label="Theme toggle"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Moon width={18} height={18} /> : <Sun width={18} height={18} />}
            </button>

            {authLoading ? (
              <div className="avatar-pill" aria-label="Auth status">
                <span style={{ fontWeight: 600 }}>…</span>
                <span>Loading</span>
              </div>
            ) : authUser ? (
              <div className="avatar-pill" aria-label="Profile menu">
                <span style={{ fontWeight: 600 }}>{String(authUser.email?.[0] ?? 'U').toUpperCase()}</span>
                <span>{String(authUser.email?.split('@')[0] ?? 'User')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Link href="/login" className="ghost-btn" style={{ padding: '10px 14px' }}>
                  Sign In
                </Link>
                <Link href="/register" className="primary-btn" style={{ padding: '10px 14px' }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="content">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <span className="crumb">Home</span>
            <span>/</span>
            <span className="crumb">Operations</span>
            <span>/</span>
            <span className="crumb" style={{ color: 'var(--text)', fontWeight: 600 }}>
              {activeTab}
            </span>
          </nav>

          {/* Hero Section */}
          <section className="hero" aria-label="Overview">
            <div>
              <p className="eyebrow">Workforce command center</p>
              <h1 style={{ marginTop: '6px' }}>Operations at a glance, beautifully organized.</h1>
              <p style={{ marginTop: '8px' }}>
                Monitor attendance, payroll, approvals, and team momentum from a polished dashboard built for ambitious teams.
              </p>
              <div className="hero-actions">
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => setShowBriefModal(true)}
                >
                  <Sparkles width={16} height={16} /> Open daily brief
                </button>
                <a
                  href="#landing-pricing"
                  className="ghost-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <ArrowUpRight width={16} height={16} /> Choose a plan
                </a>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => triggerToast('Snapshot report generated and sent to downloads!')}
                >
                  <Download width={16} height={16} /> Export snapshot
                </button>
              </div>
            </div>

            <div className="hero-metric">
              <div className="pill">● Attendance health</div>
              <div style={{ marginTop: '10px' }}>
                <div className="muted">Current rate</div>
                <div className="value" style={{ fontSize: '2rem', fontWeight: 800 }}>
                  94.6%
                </div>
              </div>
              <div className="badges" style={{ marginTop: '10px' }}>
                <span className="badge-chip success">+3.2% vs last week</span>
                <span className="badge-chip info">19 on time</span>
              </div>
            </div>
          </section>

          {billing && <SubscriptionBanner />}

          {billing && (
            <section className="plan-summary-card" style={{ marginBottom: '24px' }}>
              <div className="card" style={{ padding: '26px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">Subscription overview</p>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '10px 0' }}>{billing.planName}</h2>
                  <p className="muted" style={{ marginBottom: '14px' }}>
                    {billing.role === 'admin'
                      ? 'Current organization subscription and usage summary.'
                      : 'Managed by your organization admin. View plan details and billing in the portal.'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div>
                      <p className="muted">Status</p>
                      <strong>{billing.statusLabel}</strong>
                    </div>
                    <div>
                      <p className="muted">Employees</p>
                      <strong>
                        {billing.employeeCount}
                        {billing.maxEmployees !== null ? ` / ${billing.maxEmployees}` : ' / Unlimited'}
                      </strong>
                    </div>
                    <div>
                      <p className="muted">Payroll support</p>
                      <strong>{billing.payrollEnabled ? 'Included' : 'Not included'}</strong>
                    </div>
                    <div>
                      <p className="muted">Next billing</p>
                      <strong>{billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : '—'}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pill" style={{ marginBottom: '12px' }}>
                    {billing.hasActiveSubscription ? 'Active subscription' : 'No active subscription'}
                  </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => window.location.assign('/settings/billing')}
                      style={{ width: '100%' }}
                    >
                      Manage billing
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => window.location.assign('/pricing')}
                      style={{ width: '100%' }}
                    >
                      Change plan
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section id="landing-pricing" className="landing-pricing" aria-label="Pricing plans" style={{ marginBottom: '24px' }}>
            <div className="pricing-header card">
              <p className="eyebrow">Landing page billing</p>
              <h2>Select the right Stripe subscription plan</h2>
              <p className="muted">
                {authUser
                  ? billing?.role === 'admin'
                    ? 'Admin users can complete checkout directly from the landing page. Choose the plan and proceed to Stripe payment.'
                    : 'Your account is signed in. Ask your organization admin to complete billing or sign in with an admin account.'
                  : 'Sign in or register to compare plans and start Stripe checkout. Free trial starts after signup.'}
              </p>
            </div>

            {!authUser && !authLoading && (
              <div className="card" style={{ marginBottom: '20px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>Ready to get started?</p>
                  <p className="muted" style={{ margin: '8px 0 0' }}>
                    Create an account or sign in to purchase a plan and access your Stripe billing portal.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link href="/login" className="ghost-btn" style={{ padding: '10px 18px' }}>
                    Sign In
                  </Link>
                  <Link href="/register" className="primary-btn" style={{ padding: '10px 18px' }}>
                    Register
                  </Link>
                </div>
              </div>
            )}

            {authUser && billing?.hasActiveSubscription && (
              <div className="pricing-status-card card">
                <div className="pricing-status-top">
                  <span className="badge-chip success">Active Stripe billing</span>
                  <p className="subtle-bold" style={{ margin: '10px 0 4px' }}>
                    {billing.planName}
                  </p>
                  <p className="muted" style={{ margin: '0 0 4px' }}>
                    {billing.currentPeriodEnd
                      ? `Next billing on ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`
                      : 'Stripe subscription is active.'}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Subscription status: {billing.subscriptionStatus}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Price ID: {billing.subscriptionPriceId ?? 'not available'}
                  </p>
                  {!billing.planKey && (
                    <p className="muted" style={{ margin: 0 }}>
                      Note: active Stripe plan is not mapped to a local plan key.
                    </p>
                  )}
                </div>
                <div className="pricing-status-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => window.location.assign('/settings/billing')}
                  >
                    Manage billing
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => window.location.assign('/pricing')}
                  >
                    Change plan
                  </button>
                </div>
              </div>
            )}

            <div className="pricing-grid">
              {dashboardPlans.map((plan) => {
                const isCurrent = billing?.planKey === plan.key;
                const canCheckout = authUser && billing?.role === 'admin';
                const buttonLabel = isCurrent
                  ? 'Current plan'
                  : loadingPlan === plan.key
                    ? 'Processing...'
                    : !authUser
                      ? 'Sign in to checkout'
                      : billing?.role !== 'admin'
                        ? 'Admin access required'
                        : 'Proceed to checkout';

                return (
                  <article key={plan.key} className={`pricing-card ${isCurrent ? 'pricing-card-current' : ''}`}>
                    <div className="pricing-card-top">
                      <div>
                        <p className="eyebrow" style={{ marginBottom: '8px' }}>{plan.badge}</p>
                        <h3>{plan.name}</h3>
                      </div>
                      <div className="pricing-value">{plan.priceLabel}</div>
                    </div>
                    <p className="muted" style={{ margin: '10px 0 18px' }}>{plan.tagline}</p>
                    <ul className="pricing-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={isCurrent ? 'ghost-btn' : 'primary-btn'}
                      onClick={() => {
                        if (!isCurrent && canCheckout) {
                          handleSelectPlan(plan.key);
                        } else if (!authUser) {
                          router.push('/login');
                        }
                      }}
                      disabled={isCurrent || loadingPlan === plan.key || !canCheckout}
                    >
                      {buttonLabel}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          {/* KPI Grid */}
          <section className="kpi-grid" aria-label="Key metrics">
            <article className="card kpi-card">
              <div className="kpi-top">
                <div className="kpi-title">Total employees</div>
                <Users width={20} height={20} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="kpi-value">1,284</div>
              <div className="kpi-trend">▲ 8.1% this month</div>
            </article>

            <article className="card kpi-card">
              <div className="kpi-top">
                <div className="kpi-title">Present today</div>
                <CalendarCheck width={20} height={20} style={{ color: 'var(--success)' }} />
              </div>
              <div className="kpi-value">1,126</div>
              <div className="kpi-trend">▲ 92 on track</div>
            </article>

            <article className="card kpi-card">
              <div className="kpi-top">
                <div className="kpi-title">Late arrivals</div>
                <Clock width={20} height={20} style={{ color: 'var(--warning)' }} />
              </div>
              <div className="kpi-value">37</div>
              <div className="kpi-trend" style={{ color: 'var(--warning)' }}>
                ▼ 6% improvement
              </div>
            </article>

            <article className="card kpi-card">
              <div className="kpi-top">
                <div className="kpi-title">Payroll summary</div>
                <DollarSign width={20} height={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="kpi-value">$482k</div>
              <div className="kpi-trend">▲ 12.4% this cycle</div>
            </article>
          </section>

          {/* Widget Grid */}
          <section className="widget-grid" aria-label="Additional dashboard widgets">
            <article className="card mini-card">
              <div className="kpi-title">Employees absent</div>
              <div className="value">58</div>
              <div className="muted">5.2% of workforce</div>
            </article>

            <article className="card mini-card">
              <div className="kpi-title">Monthly salary expense</div>
              <div className="value">$1.24M</div>
              <div className="muted">Budget pacing +7.3%</div>
            </article>

            <article className="card mini-card">
              <div className="kpi-title">Overtime hours</div>
              <div className="value">184h</div>
              <div className="muted">Ops team leading</div>
            </article>

            <article className="card mini-card">
              <div className="kpi-title">Active projects</div>
              <div className="value">24</div>
              <div className="muted">6 on critical path</div>
            </article>

            <article className="card mini-card">
              <div className="kpi-title">Attendance rate</div>
              <div className="value">94.6%</div>
              <div className="muted">Healthy trend this week</div>
            </article>

            <article className="card mini-card">
              <div className="kpi-title">Weekly trend</div>
              <div className="mini-bar" aria-hidden="true">
                <span style={{ height: '44%' }} />
                <span style={{ height: '60%' }} />
                <span style={{ height: '52%' }} />
                <span style={{ height: '70%' }} />
                <span style={{ height: '80%' }} />
                <span style={{ height: '92%' }} />
              </div>
            </article>
          </section>

          {/* Panel Grid 1: Charts & Department Pulse */}
          <section className="panel-grid">
            <article className="card chart-card">
              <div className="card-head">
                <h3>Attendance trend</h3>
                <div className="segmented" role="tablist" aria-label="Chart range">
                  {(['7d', '30d', '90d'] as RangeKey[]).map((key) => (
                    <button
                      key={key}
                      className={range === key ? 'active' : ''}
                      type="button"
                      onClick={() => setRange(key)}
                    >
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Interactive SVG Chart */}
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                  viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
                  role="img"
                  aria-label="Interactive attendance trend chart"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                >
                  <rect
                    x="0"
                    y="0"
                    width={chartPoints.width}
                    height={chartPoints.height}
                    rx="24"
                    fill="transparent"
                  />
                  <g stroke="rgba(148,163,184,0.18)" strokeWidth="1">
                    <line
                      x1={chartPoints.padding}
                      y1={chartPoints.padding}
                      x2={chartPoints.padding}
                      y2={chartPoints.height - chartPoints.padding}
                    />
                    <line
                      x1={chartPoints.padding}
                      y1={chartPoints.height - chartPoints.padding}
                      x2={chartPoints.width - chartPoints.padding}
                      y2={chartPoints.height - chartPoints.padding}
                    />
                    <line
                      x1={chartPoints.padding}
                      y1={
                        chartPoints.height -
                        chartPoints.padding -
                        (chartPoints.height - chartPoints.padding * 2) / 2
                      }
                      x2={chartPoints.width - chartPoints.padding}
                      y2={
                        chartPoints.height -
                        chartPoints.padding -
                        (chartPoints.height - chartPoints.padding * 2) / 2
                      }
                    />
                  </g>
                  <path d={chartPoints.areaData} fill="rgba(37, 99, 235, 0.16)" />
                  <path
                    d={chartPoints.pathData}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {chartPoints.coords.map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="var(--info)" />
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        fill="var(--text)"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {pt.val}%
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="chart-info">
                <span>
                  <span className="legend-dot" style={{ background: 'var(--primary)' }} />
                  Attendance Rate
                </span>
                <span>
                  <span className="legend-dot" style={{ background: 'var(--info)' }} />
                  On-time Arrivals
                </span>
              </div>
            </article>

            {/* Department Pulse */}
            <article className="card">
              <div className="card-head">
                <h3>Department pulse</h3>
                <a
                  href="#"
                  className="muted"
                  onClick={(e) => {
                    e.preventDefault();
                    triggerToast('Department analytics detail loaded');
                  }}
                >
                  View all
                </a>
              </div>
              <div className="list-stack">
                <div className="list-item">
                  <div>
                    <strong>Operations</strong>
                    <div className="muted">91% punctuality</div>
                  </div>
                  <span className="badge-chip success">High</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>Engineering</strong>
                    <div className="muted">88% productivity</div>
                  </div>
                  <span className="badge-chip info">Stable</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>Finance</strong>
                    <div className="muted">12 approvals pending</div>
                  </div>
                  <span className="badge-chip warning">Watch</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>Design & Product</strong>
                    <div className="muted">96% satisfaction</div>
                  </div>
                  <span className="badge-chip success">Optimal</span>
                </div>
              </div>
            </article>
          </section>

          {/* Panel Grid 2: Payroll Trend & Recent Activities */}
          <section className="panel-grid" style={{ gridTemplateColumns: '1.05fr 0.95fr' }}>
            <article className="card chart-card">
              <div className="card-head">
                <h3>Payroll trend</h3>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => triggerToast('Exporting Payroll Report CSV...')}
                >
                  <Download width={14} height={14} /> Export
                </button>
              </div>
              <svg viewBox="0 0 560 260" role="img" aria-label="Payroll trend chart" style={{ width: '100%', height: 'auto' }}>
                <rect x="24" y="24" width="512" height="212" rx="24" fill="rgba(37, 99, 235, 0.08)" />
                <path
                  d="M60 188 C118 160, 146 136, 178 140 S248 178, 282 152 S376 96, 430 106 S500 138, 500 118"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M60 188 C118 160, 146 136, 178 140 S248 178, 282 152 S376 96, 430 106 S500 138, 500 118"
                  stroke="rgba(14,165,233,0.24)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </article>

            <article className="card">
              <div className="card-head">
                <h3>Recent activities</h3>
                <a
                  href="#"
                  className="muted"
                  onClick={(e) => {
                    e.preventDefault();
                    triggerToast('Activity log view opened');
                  }}
                >
                  See timeline
                </a>
              </div>
              <div className="small-list">
                <div className="list-item">
                  <div>
                    <strong>Payroll approved</strong>
                    <div className="muted">12 mins ago</div>
                  </div>
                  <span className="badge-chip success">Done</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>New leave request</strong>
                    <div className="muted">28 mins ago</div>
                  </div>
                  <span className="badge-chip warning">Pending</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>Project milestone</strong>
                    <div className="muted">1 hr ago</div>
                  </div>
                  <span className="badge-chip info">Tracked</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>New employee onboarded</strong>
                    <div className="muted">3 hrs ago</div>
                  </div>
                  <span className="badge-chip success">Completed</span>
                </div>
              </div>
            </article>
          </section>

          {/* Bottom Grid: Leave Requests Table & Upcoming Holidays */}
          <section className="bottom-grid">
            <article className="card">
              <div className="card-head">
                <h3>Leave requests</h3>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => triggerToast('Leave Management Console opened')}
                >
                  Manage
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaveRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--primary-soft)',
                                color: 'var(--primary)',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {req.avatar}
                            </span>
                            {req.employee}
                          </div>
                        </td>
                        <td>{req.type}</td>
                        <td>{req.dates}</td>
                        <td>
                          <span className={`status ${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          {req.status !== 'Approved' ? (
                            <button
                              className="ghost-btn"
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                              onClick={() => handleStatusChange(req.id, 'Approved')}
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="muted" style={{ fontSize: '0.78rem' }}>Synced</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <div className="list-stack">
              <article className="card">
                <div className="card-head">
                  <h3>Upcoming holidays</h3>
                  <a
                    href="#"
                    className="muted"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerToast('Full calendar view opened');
                    }}
                  >
                    Calendar
                  </a>
                </div>
                <div className="list-stack">
                  <div className="list-item">
                    <div>
                      <strong>National Day</strong>
                      <div className="muted">Monday • 3 days away</div>
                    </div>
                    <span className="badge-chip info">Public</span>
                  </div>
                  <div className="list-item">
                    <div>
                      <strong>Company Retreat</strong>
                      <div className="muted">Thursday • 5 days away</div>
                    </div>
                    <span className="badge-chip warning">Team</span>
                  </div>
                  <div className="list-item">
                    <div>
                      <strong>Labor Day</strong>
                      <div className="muted">Sep 01 • 3 weeks away</div>
                    </div>
                    <span className="badge-chip info">Public</span>
                  </div>
                </div>
              </article>

              <article className="card">
                <div className="card-head">
                  <h3>Quick links</h3>
                </div>
                <div className="footer-links">
                  <a href="#" onClick={(e) => { e.preventDefault(); triggerToast('Payroll pack downloaded'); }}>
                    Payroll pack
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); triggerToast('Holiday policy document opened'); }}>
                    Holiday policy
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); triggerToast('Export guide loaded'); }}>
                    Export guide
                  </a>
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>

      {/* Modal: Daily Brief */}
      {showBriefModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          onClick={() => setShowBriefModal(false)}
        >
          <div
            className="card"
            style={{ width: '90%', maxWidth: '540px', padding: '28px', background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles style={{ color: 'var(--gold)' }} />
                <h3>Daily Workforce Executive Brief</h3>
              </div>
              <button className="icon-btn" onClick={() => setShowBriefModal(false)}>
                <X width={18} height={18} />
              </button>
            </div>
            <p className="muted" style={{ marginBottom: '16px' }}>
              Summary generated at {new Date().toLocaleTimeString()} for Executive Leadership.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div className="list-item">
                <CheckCircle2 style={{ color: 'var(--success)' }} width={18} height={18} />
                <div>
                  <strong>Attendance target reached:</strong> 94.6% vs 92% goal.
                </div>
              </div>
              <div className="list-item">
                <AlertCircle style={{ color: 'var(--warning)' }} width={18} height={18} />
                <div>
                  <strong>Pending Approvals:</strong> 12 finance vouchers require signoff.
                </div>
              </div>
              <div className="list-item">
                <Clock3 style={{ color: 'var(--info)' }} width={18} height={18} />
                <div>
                  <strong>Shift Coverage:</strong> Operations morning shift 100% staffed.
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="ghost-btn" onClick={() => setShowBriefModal(false)}>
                Close
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setShowBriefModal(false);
                  triggerToast('Daily brief emailed to your inbox');
                }}
              >
                Send to Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Notifications */}
      {showNotifDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999,
          }}
          onClick={() => setShowNotifDrawer(false)}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '360px',
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Notifications</h3>
              <button className="icon-btn" onClick={() => setShowNotifDrawer(false)}>
                <X width={18} height={18} />
              </button>
            </div>
            <div className="list-stack" style={{ marginTop: '12px' }}>
              <div className="list-item">
                <div>
                  <strong>Payroll Disbursed</strong>
                  <div className="muted">Cycle Q3 #2 completed successfully</div>
                </div>
              </div>
              <div className="list-item">
                <div>
                  <strong>Overtime Alert</strong>
                  <div className="muted">Ops team exceeded 150h threshold</div>
                </div>
              </div>
              <div className="list-item">
                <div>
                  <strong>System Maintenance</strong>
                  <div className="muted">Scheduled for Aug 1st 02:00 UTC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
