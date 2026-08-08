'use client';

import React, { useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';

interface NotificationItem {
  id: string;
  type: 'visa_expiry' | 'emirates_id_expiry' | 'passport_expiry' | 'labour_card_expiry' | 'trial_expiry' | 'payroll_ready' | 'public_holiday';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const supabase = createClient();
      // In a real implementation, this would fetch from a notifications table
      // For now, return empty array as notifications should be generated from real events
      setNotifications([]);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

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

          <button className="btn-secondary" onClick={markAllRead} disabled={notifications.length === 0}>
            <CheckCheck width={16} height={16} /> Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p className="muted">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <Bell width={48} height={48} className="muted" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>No Notifications</h3>
            <p className="muted">You're all caught up! No new notifications at this time.</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
