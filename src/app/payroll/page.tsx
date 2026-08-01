'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Download, Calendar, CheckCircle2, TrendingUp, Filter, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';

interface PayrollRecord {
  id: string;
  employee: string;
  department: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  totalPayout: number;
  status: 'Disbursed' | 'Approved' | 'Pending Signoff';
}

const mockPayrollRecords: PayrollRecord[] = [
  { id: 'PAY-001', employee: 'Alicia Chen', department: 'Operations', baseSalary: 8500, overtimeHours: 12, overtimePay: 640, bonus: 500, totalPayout: 9640, status: 'Disbursed' },
  { id: 'PAY-002', employee: 'Marcus Lee', department: 'Engineering', baseSalary: 9200, overtimeHours: 8, overtimePay: 480, bonus: 1000, totalPayout: 10680, status: 'Approved' },
  { id: 'PAY-003', employee: 'Diana Ortiz', department: 'Finance', baseSalary: 7400, overtimeHours: 0, overtimePay: 0, bonus: 300, totalPayout: 7700, status: 'Pending Signoff' },
  { id: 'PAY-004', employee: 'James Taylor', department: 'Design & Product', baseSalary: 8100, overtimeHours: 5, overtimePay: 275, bonus: 400, totalPayout: 8775, status: 'Approved' },
  { id: 'PAY-005', employee: 'Sophia Wang', department: 'Engineering', baseSalary: 7800, overtimeHours: 14, overtimePay: 770, bonus: 0, totalPayout: 8570, status: 'Disbursed' },
];

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>(mockPayrollRecords);
  const [cycle, setCycle] = useState('August 2026 - Cycle 1');

  const exportCSV = () => {
    const csvData = records.map((r) => ({
      'Record ID': r.id,
      Employee: r.employee,
      Department: r.department,
      'Base Salary ($)': r.baseSalary,
      'Overtime Hours': r.overtimeHours,
      'Overtime Pay ($)': r.overtimePay,
      'Bonus ($)': r.bonus,
      'Total Payout ($)': r.totalPayout,
      Status: r.status,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPayroll = records.reduce((acc, curr) => acc + curr.totalPayout, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Navigation */}
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
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Payroll & Compensation OS</h1>
            <p className="muted" style={{ marginTop: '4px' }}>
              Automated salary distribution, overtime compensation, bonuses, and tax compliance audit log.
            </p>
          </div>

          <button className="primary-btn" onClick={exportCSV}>
            <FileSpreadsheet width={16} height={16} /> Export Payroll CSV
          </button>
        </div>

        {/* Metric Cards */}
        <div className="kpi-grid" style={{ marginBottom: '28px' }}>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Current Cycle Payout</div>
              <DollarSign width={20} height={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="kpi-value">${(totalPayroll / 1000).toFixed(1)}k</div>
            <div className="kpi-trend">▲ 4.2% vs previous cycle</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Total Overtime Paid</div>
              <TrendingUp width={20} height={20} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="kpi-value">$2,165</div>
            <div className="kpi-trend" style={{ color: 'var(--success)' }}>▼ 8% optimization</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Active Cycle</div>
              <Calendar width={20} height={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="kpi-value" style={{ fontSize: '1.2rem', marginTop: '4px' }}>{cycle}</div>
            <div className="kpi-trend">Closing in 4 days</div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Employee Salary Breakdown</h3>
            <span className="badge-chip info">5 Entries Synced</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Base Salary</th>
                  <th>Overtime (hrs / $)</th>
                  <th>Bonus</th>
                  <th>Net Payout</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td><strong style={{ fontFamily: 'monospace' }}>{rec.id}</strong></td>
                    <td>{rec.employee}</td>
                    <td>{rec.department}</td>
                    <td>${rec.baseSalary.toLocaleString()}</td>
                    <td>
                      {rec.overtimeHours}h (<span className="muted">${rec.overtimePay}</span>)
                    </td>
                    <td>${rec.bonus}</td>
                    <td><strong style={{ color: 'var(--primary)' }}>${rec.totalPayout.toLocaleString()}</strong></td>
                    <td>
                      <span
                        className={`status ${
                          rec.status === 'Disbursed'
                            ? 'approved'
                            : rec.status === 'Approved'
                            ? 'pending'
                            : 'review'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
