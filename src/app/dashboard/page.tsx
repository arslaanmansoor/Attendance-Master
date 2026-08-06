'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  totalPayroll: number;
  monthlyAttendance: {
    present: number;
    absent: number;
    leave: number;
  };
  recentActivities: Array<{
    action: string;
    details: string;
    created_at: string;
  }>;
  recentAttendance: Array<{
    date: string;
    profiles: {
      full_name: string;
      employee_id: string | null;
    };
    status: string;
    time_in: string | null;
    time_out: string | null;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 className="spin" width={32} height={32} style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Dashboard</h1>
          <p className="muted">Welcome back! Here's an overview of your workforce management.</p>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid" style={{ marginBottom: '32px' }}>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Total Employees</div>
              <Users width={20} height={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="kpi-value">{stats?.totalEmployees || 0}</div>
            <div className="kpi-trend">Active workforce</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Present Today</div>
              <CheckCircle2 width={20} height={20} style={{ color: 'var(--success)' }} />
            </div>
            <div className="kpi-value">{stats?.presentToday || 0}</div>
            <div className="kpi-trend">
              {stats?.absentToday || 0} absent • {stats?.onLeaveToday || 0} on leave
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Monthly Payroll</div>
              <DollarSign width={20} height={20} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="kpi-value">${(stats?.totalPayroll || 0).toLocaleString()}</div>
            <div className="kpi-trend">Total disbursed this month</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Monthly Attendance</div>
              <Calendar width={20} height={20} style={{ color: 'var(--info)' }} />
            </div>
            <div className="kpi-value">{stats?.monthlyAttendance?.present || 0}</div>
            <div className="kpi-trend">
              {stats?.monthlyAttendance?.absent || 0} absent • {stats?.monthlyAttendance?.leave || 0} leave
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Link
              href="/employees"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <Users width={20} height={20} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 600 }}>Manage Employees</span>
              <ArrowRight width={16} height={16} style={{ marginLeft: 'auto' }} />
            </Link>

            <Link
              href="/timesheets"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <Clock width={20} height={20} style={{ color: 'var(--success)' }} />
              <span style={{ fontWeight: 600 }}>Record Attendance</span>
              <ArrowRight width={16} height={16} style={{ marginLeft: 'auto' }} />
            </Link>

            <Link
              href="/payroll"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <DollarSign width={20} height={20} style={{ color: 'var(--warning)' }} />
              <span style={{ fontWeight: 600 }}>Process Payroll</span>
              <ArrowRight width={16} height={16} style={{ marginLeft: 'auto' }} />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity width={18} height={18} /> Recent Attendance
            </h3>
            {stats?.recentAttendance && stats.recentAttendance.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recentAttendance.map((record, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'var(--bg)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{record.profiles.full_name}</div>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        {record.profiles.employee_id || 'N/A'} • {record.date}
                      </div>
                    </div>
                    <span
                      className={`badge-chip ${
                        record.status === 'Present'
                          ? 'success'
                          : record.status === 'Absent'
                          ? 'danger'
                          : 'warning'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: '0.9rem', padding: '16px', textAlign: 'center' }}>
                No recent attendance records
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp width={18} height={18} /> System Activity
            </h3>
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'var(--bg)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{activity.action}</div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{activity.details}</div>
                    <div className="muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: '0.9rem', padding: '16px', textAlign: 'center' }}>
                No recent system activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}