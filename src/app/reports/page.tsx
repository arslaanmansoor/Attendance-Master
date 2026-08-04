'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  BarChart3,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Search,
} from 'lucide-react';
import Papa from 'papaparse';

type ReportType =
  | 'emp_attendance'
  | 'emp_timesheet'
  | 'emp_payroll'
  | 'project_wise'
  | 'monthly_attendance'
  | 'daily_attendance'
  | 'overtime_report'
  | 'leave_report'
  | 'summary_attendance'
  | 'summary_payroll'
  | 'summary_employee'
  | 'summary_project'
  | 'summary_company';

const reportOptions: { key: ReportType; label: string; category: 'Detailed' | 'Summary' }[] = [
  { key: 'emp_attendance', label: 'Employee Attendance Report', category: 'Detailed' },
  { key: 'emp_timesheet', label: 'Employee Timesheet Report', category: 'Detailed' },
  { key: 'emp_payroll', label: 'Employee Payroll Report', category: 'Detailed' },
  { key: 'project_wise', label: 'Project-wise Report', category: 'Detailed' },
  { key: 'monthly_attendance', label: 'Monthly Attendance Report', category: 'Detailed' },
  { key: 'daily_attendance', label: 'Daily Attendance Report', category: 'Detailed' },
  { key: 'overtime_report', label: 'Overtime Hours Report', category: 'Detailed' },
  { key: 'leave_report', label: 'Leave & Absences Report', category: 'Detailed' },
  { key: 'summary_attendance', label: 'Attendance Summary', category: 'Summary' },
  { key: 'summary_payroll', label: 'Payroll & Cost Summary', category: 'Summary' },
  { key: 'summary_employee', label: 'Employee Summary', category: 'Summary' },
  { key: 'summary_project', label: 'Project Summary', category: 'Summary' },
  { key: 'summary_company', label: 'Company Overview Summary', category: 'Summary' },
];

const mockReportData = [
  { empCode: 'EMP-001', empName: 'Zayed Al-Mansoori', project: 'Burj Vista Tower Maintenance', date: '2026-08-03', presentDays: 24, overtimeHrs: 14, basicSalary: 7200, netPay: 16705.85, status: 'Present' },
  { empCode: 'EMP-002', empName: 'Rashid Khan', project: 'Dubai Logistics Warehouse B', date: '2026-08-03', presentDays: 26, overtimeHrs: 22, basicSalary: 3900, netPay: 9515.63, status: 'Present' },
  { empCode: 'EMP-003', empName: 'Tariq Mahmoud', project: 'Downtown Commercial Plaza', date: '2026-08-03', presentDays: 22, overtimeHrs: 0, basicSalary: 5100, netPay: 10466.67, status: 'Sick Leave' },
  { empCode: 'EMP-004', empName: 'Vikram Singh', project: 'Sharjah Residential Complex', date: '2026-08-03', presentDays: 25, overtimeHrs: 18, basicSalary: 4200, netPay: 8900.00, status: 'Present' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('emp_attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');

  const activeReportConfig = reportOptions.find((r) => r.key === selectedReport);

  const filteredData = mockReportData.filter((item) => {
    if (searchQuery && !item.empName.toLowerCase().includes(searchQuery.toLowerCase()) && !item.project.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const exportCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReport}_${Date.now()}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Navigation Header */}
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
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Reports & Executive Analytics</h1>
            <p className="muted" style={{ marginTop: '4px' }}>
              Generate, filter, print, and export 13 comprehensive reports (CSV, Excel, PDF ready).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }} className="no-print">
            <button className="btn-secondary" onClick={handlePrint}>
              <Printer width={16} height={16} /> Print Report
            </button>
            <button className="primary-btn" onClick={exportCSV}>
              <FileSpreadsheet width={16} height={16} /> Export CSV / Excel
            </button>
          </div>
        </div>

        {/* Report Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          <div className="card no-print" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Select Report Type</h3>

            <div style={{ marginBottom: '16px' }}>
              <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 700 }}>
                Detailed Reports (8)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {reportOptions
                  .filter((r) => r.category === 'Detailed')
                  .map((r) => (
                    <button
                      key={r.key}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selectedReport === r.key ? 'var(--primary-soft)' : 'transparent',
                        color: selectedReport === r.key ? 'var(--primary)' : 'var(--text)',
                        fontWeight: selectedReport === r.key ? 700 : 500,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedReport(r.key)}
                    >
                      {r.label}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 700 }}>
                Summary Reports (5)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {reportOptions
                  .filter((r) => r.category === 'Summary')
                  .map((r) => (
                    <button
                      key={r.key}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selectedReport === r.key ? 'var(--primary-soft)' : 'transparent',
                        color: selectedReport === r.key ? 'var(--primary)' : 'var(--text)',
                        fontWeight: selectedReport === r.key ? 700 : 500,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedReport(r.key)}
                    >
                      {r.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Main Report View Area */}
          <div>
            {/* Filters bar */}
            <div className="card no-print" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
                <Search width={16} height={16} className="muted" />
                <input
                  type="text"
                  placeholder="Search employee or project..."
                  style={{ border: 'none', background: 'none', padding: '10px', color: 'var(--text)', width: '100%', outline: 'none' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="muted" style={{ fontSize: '0.85rem' }}>From:</span>
                <input type="date" className="form-input" style={{ width: 'auto' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="muted" style={{ fontSize: '0.85rem' }}>To:</span>
                <input type="date" className="form-input" style={{ width: 'auto' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Generated Report Content Area */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeReportConfig?.label}</h2>
                  <p className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    Al-Mansoor Construction LLC | Period: {startDate} to {endDate}
                  </p>
                </div>
                <span className="badge-chip info">{activeReportConfig?.category}</span>
              </div>

              {/* Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Emp Code</th>
                      <th>Employee Name</th>
                      <th>Project / Site</th>
                      <th>Present Days</th>
                      <th>Overtime Hrs</th>
                      <th>Basic Salary</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.empCode}</strong></td>
                        <td>{row.empName}</td>
                        <td style={{ fontSize: '0.88rem' }}>{row.project}</td>
                        <td style={{ fontSize: '0.88rem' }}>{row.presentDays} days</td>
                        <td style={{ fontSize: '0.88rem', color: 'var(--warning)', fontWeight: 600 }}>+{row.overtimeHrs} hrs</td>
                        <td style={{ fontSize: '0.88rem' }}>${row.basicSalary.toLocaleString()}</td>
                        <td><strong style={{ color: 'var(--primary)' }}>${row.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                        <td>
                          <span className={`badge-chip ${row.status === 'Present' ? 'success' : 'warning'}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
