'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Sparkles,
  Calendar,
  DollarSign,
  ShieldAlert,
  Clock3,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'visa_expiry' | 'emirates_id_expiry' | 'passport_expiry' | 'labour_card_expiry' | 'trial_expiry' | 'payroll_ready' | 'public_holiday';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'NOT-101',
    type: 'visa_expiry',
    title: 'Visa Expiry Reminder',
    message: "Employee Zayed Al-Mansoori's Residence Visa expires in 6 days (10 Aug 2026). Please initiate PRO renewal.",
    timestamp: '10 mins ago',
    isRead: false,
    link: '/company',
  },
  {
    id: 'NOT-102',
    type: 'trial_expiry',
    title: 'Free Trial Status',
    message: 'Your 3-Day Free Trial has 3 days remaining. Choose a Pro, Premium, or Platinum plan to keep full access uninterrupted.',
    timestamp: '1 hour ago',
    isRead: false,
    link: '/pricing',
  },
  {
    id: 'NOT-103',
    type: 'payroll_ready',
    title: 'August Payroll Ready for Signoff',
    message: 'Monthly payroll run for August 2026 is generated with total payout $36,688.15.',
    timestamp: '3 hours ago',
    isRead: true,
    link: '/payroll',
  },
  {
    id: 'NOT-104',
    type: 'public_holiday',
    title: 'Upcoming Public Holiday',
    message: 'Islamic New Year public holiday has been marked for next week. Timesheet records will adjust automatically.',
    timestamp: '1 day ago',
    isRead: true,
    link: '/timesheets',
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--muted)',
                fontSize: '0.88rem',
                textDecoration: 'none',
                marginBottom: '12px',
              }}
            >
              <ArrowLeft width={16} height={16} /> Back to Dashboard
            </Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Notification & Compliance Reminders</h1>
            <p className="muted" style={{ marginTop: '4px' }}>
              Automated reminders for Subscription & Trial Expiry, Document Expiries (Visa, EID, Passport, Labour Card), and Payroll Readiness.
            </p>
          </div>

          <button className="btn-secondary" onClick={markAllRead}>
            <CheckCheck width={16} height={16} /> Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                borderLeft: n.isRead ? '4px solid var(--border)' : '4px solid var(--primary)',
                background: n.isRead ? 'var(--bg-card)' : 'var(--primary-soft)',
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {n.type === 'visa_expiry' ? (
                  <AlertTriangle width={22} height={22} style={{ color: 'var(--danger)' }} />
                ) : n.type === 'trial_expiry' ? (
                  <Sparkles width={22} height={22} style={{ color: 'var(--primary)' }} />
                ) : n.type === 'payroll_ready' ? (
                  <DollarSign width={22} height={22} style={{ color: 'var(--success)' }} />
                ) : (
                  <Bell width={22} height={22} style={{ color: 'var(--accent)' }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{n.title}</h4>
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    {n.timestamp}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', marginTop: '6px', color: 'var(--text)' }}>{n.message}</p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Link href={n.link} className="primary-btn" style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.8rem' }}>
                    Take Action
                  </Link>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--muted)' }}
                    onClick={() => toggleRead(n.id)}
                  >
                    {n.isRead ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
