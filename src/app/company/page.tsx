'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  CalendarCheck,
  Award,
  Users,
  AlertTriangle,
  Upload,
  QrCode,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

interface ExpiryItem {
  empCode: string;
  name: string;
  docType: 'Visa' | 'Emirates ID' | 'Passport' | 'Labour Card' | 'Contract';
  expiryDate: string;
  daysRemaining: number;
  status: 'Critical' | 'Warning' | 'Valid';
}

const mockExpiries: ExpiryItem[] = [
  { empCode: 'EMP-001', name: 'Zayed Al-Mansoori', docType: 'Visa', expiryDate: '2026-08-10', daysRemaining: 6, status: 'Critical' },
  { empCode: 'EMP-002', name: 'Rashid Khan', docType: 'Emirates ID', expiryDate: '2026-08-18', daysRemaining: 14, status: 'Warning' },
  { empCode: 'EMP-003', name: 'Tariq Mahmoud', docType: 'Labour Card', expiryDate: '2026-08-25', daysRemaining: 21, status: 'Warning' },
  { empCode: 'EMP-004', name: 'Vikram Singh', docType: 'Passport', expiryDate: '2027-02-15', daysRemaining: 195, status: 'Valid' },
];

export default function UAECompanyPage() {
  const [activeTab, setActiveTab] = useState<'expiries' | 'projects' | 'sites' | 'departments'>('expiries');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
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
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>UAE Construction Company Management</h1>
            <p className="muted" style={{ marginTop: '4px' }}>
              Multi-Company, Site Locations, Projects, Document Expiry Tracking (Visa, EID, Passport, Labour Card, Contract) & QR Badges.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
          <button
            className={activeTab === 'expiries' ? 'primary-btn' : 'btn-secondary'}
            onClick={() => setActiveTab('expiries')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <AlertTriangle width={16} height={16} /> Document Expiries Tracking
          </button>
          <button
            className={activeTab === 'projects' ? 'primary-btn' : 'btn-secondary'}
            onClick={() => setActiveTab('projects')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Briefcase width={16} height={16} /> Active Construction Projects
          </button>
          <button
            className={activeTab === 'sites' ? 'primary-btn' : 'btn-secondary'}
            onClick={() => setActiveTab('sites')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MapPin width={16} height={16} /> Site Locations
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'expiries' && (
          <div>
            <div className="kpi-grid" style={{ marginBottom: '24px' }}>
              <div className="card kpi-card">
                <div className="kpi-top">
                  <div className="kpi-title">Critical Expiries (&lt;7 Days)</div>
                  <AlertTriangle width={20} height={20} style={{ color: 'var(--danger)' }} />
                </div>
                <div className="kpi-value">1 Document</div>
                <div className="kpi-trend">Action required immediately</div>
              </div>
              <div className="card kpi-card">
                <div className="kpi-top">
                  <div className="kpi-title">Upcoming Expiries (30 Days)</div>
                  <Clock3 width={20} height={20} style={{ color: 'var(--warning)' }} />
                </div>
                <div className="kpi-value">2 Documents</div>
                <div className="kpi-trend">PRO renewal in progress</div>
              </div>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp Code</th>
                    <th>Employee Name</th>
                    <th>Document Type</th>
                    <th>Expiry Date</th>
                    <th>Days Remaining</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExpiries.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.empCode}</strong></td>
                      <td>{item.name}</td>
                      <td>
                        <span className="badge-chip info">{item.docType}</span>
                      </td>
                      <td>{item.expiryDate}</td>
                      <td>
                        <strong style={{ color: item.status === 'Critical' ? 'var(--danger)' : item.status === 'Warning' ? 'var(--warning)' : 'var(--success)' }}>
                          {item.daysRemaining} days
                        </strong>
                      </td>
                      <td>
                        <span className={`badge-chip ${item.status === 'Critical' ? 'danger' : item.status === 'Warning' ? 'warning' : 'success'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          <Upload width={14} height={14} /> Renew & Upload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Company Projects & Sites</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ padding: '20px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Burj Vista Tower Maintenance</h4>
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>Downtown Dubai | Code: PRJ-101</p>
                <div style={{ marginTop: '16px', fontSize: '0.88rem' }}>
                  Progress: <strong>65%</strong>
                </div>
              </div>
              <div className="card" style={{ padding: '20px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dubai Logistics Warehouse B</h4>
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>Dubai South | Code: PRJ-102</p>
                <div style={{ marginTop: '16px', fontSize: '0.88rem' }}>
                  Progress: <strong>40%</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sites' && (
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Registered Site Locations</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Downtown Dubai Site A</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>Plot 14, Boulevard Street</div>
                </div>
                <span className="badge-chip success">Active Site</span>
              </li>
              <li style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Dubai South Logistics Hub</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>Near Expo City Avenue</div>
                </div>
                <span className="badge-chip success">Active Site</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
