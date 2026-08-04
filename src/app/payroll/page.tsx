'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import Papa from 'papaparse';

interface EmployeePayroll {
  id: string;
  empCode: string;
  name: string;
  department: string;
  designation: string;
  monthlySalary: number;
  basicSalary: number;
  hourlyRate: number;
  normalHours: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  allowances: number;
  deductions: number;
  advances: number;
  leaveDeductions: number;
  netSalary: number;
  status: 'Paid' | 'Approved' | 'Draft';
}

const mockPayrolls: EmployeePayroll[] = [
  {
    id: 'PR-101',
    empCode: 'EMP-001',
    name: 'Zayed Al-Mansoori',
    department: 'Engineering',
    designation: 'Senior Project Engineer',
    monthlySalary: 12000,
    basicSalary: 7200,
    hourlyRate: 34.62,
    normalHours: 208,
    overtimeHours: 14,
    overtimeRate: 1.25,
    overtimePay: 605.85,
    allowances: 4800,
    deductions: 200,
    advances: 500,
    leaveDeductions: 0,
    netSalary: 16705.85,
    status: 'Paid',
  },
  {
    id: 'PR-102',
    empCode: 'EMP-002',
    name: 'Rashid Khan',
    department: 'Operations',
    designation: 'Steel Master Fitter',
    monthlySalary: 6500,
    basicSalary: 3900,
    hourlyRate: 18.75,
    normalHours: 208,
    overtimeHours: 22,
    overtimeRate: 1.25,
    overtimePay: 515.63,
    allowances: 2600,
    deductions: 100,
    advances: 0,
    leaveDeductions: 0,
    netSalary: 9515.63,
    status: 'Approved',
  },
  {
    id: 'PR-103',
    empCode: 'EMP-003',
    name: 'Tariq Mahmoud',
    department: 'Safety & Site',
    designation: 'HSE Coordinator',
    monthlySalary: 8500,
    basicSalary: 5100,
    hourlyRate: 24.52,
    normalHours: 208,
    overtimeHours: 0,
    overtimeRate: 1.25,
    overtimePay: 0,
    allowances: 3400,
    deductions: 150,
    advances: 1000,
    leaveDeductions: 283.33,
    netSalary: 10466.67,
    status: 'Draft',
  },
];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<EmployeePayroll[]>(mockPayrolls);
  const [cycle, setCycle] = useState('August 2026 Payroll Run');
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeePayroll | null>(null);

  const totalNet = payrolls.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalOvertime = payrolls.reduce((acc, curr) => acc + curr.overtimePay, 0);

  const exportCSV = () => {
    const csvData = payrolls.map((p) => ({
      'Employee Code': p.empCode,
      Name: p.name,
      Department: p.department,
      Designation: p.designation,
      'Basic Salary (AED/USD)': p.basicSalary,
      'Hourly Rate': p.hourlyRate,
      'Normal Hours': p.normalHours,
      'Overtime Hours': p.overtimeHours,
      'Overtime Pay': p.overtimePay,
      Allowances: p.allowances,
      Deductions: p.deductions,
      Advances: p.advances,
      'Leave Deductions': p.leaveDeductions,
      'Net Salary': p.netSalary,
      Status: p.status,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll_summary_${Date.now()}.csv`;
    link.click();
  };

  const handlePrintPayslip = () => {
    window.print();
  };

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
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Payroll & Payslip OS (UAE Labour Compliant)</h1>
            <p className="muted" style={{ marginTop: '4px' }}>
              Automated salary computation from timesheets: Basic, Hourly Rate, Overtime (1.25x/1.5x), Allowances, Advances & Payslip PDF Export.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="primary-btn" onClick={exportCSV}>
              <FileSpreadsheet width={16} height={16} /> Export Payroll CSV
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="kpi-grid" style={{ marginBottom: '28px' }}>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Total Monthly Net Payout</div>
              <DollarSign width={20} height={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="kpi-value">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="kpi-trend">Computed from active timesheets</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Total Overtime Disbursed</div>
              <Sparkles width={20} height={20} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="kpi-value">${totalOvertime.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="kpi-trend">Configurable UAE Overtime Rules</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Active Payslips Ready</div>
              <FileText width={20} height={20} style={{ color: 'var(--success)' }} />
            </div>
            <div className="kpi-value">{payrolls.length}</div>
            <div className="kpi-trend">Download & Printable PDF</div>
          </div>
        </div>

        {/* Payroll Summary Table */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Name & Designation</th>
                <th>Basic Salary</th>
                <th>Hourly Rate</th>
                <th>Normal / OT Hrs</th>
                <th>OT Pay</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.empCode}</strong>
                  </td>
                  <td>
                    <div>
                      <strong>{p.name}</strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {p.designation} ({p.department})
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.88rem' }}>${p.basicSalary.toLocaleString()}</td>
                  <td style={{ fontSize: '0.88rem' }}>${p.hourlyRate}/hr</td>
                  <td style={{ fontSize: '0.88rem' }}>
                    {p.normalHours}h / <span style={{ color: 'var(--warning)', fontWeight: 600 }}>+{p.overtimeHours}h</span>
                  </td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--warning)', fontWeight: 600 }}>+${p.overtimePay.toFixed(2)}</td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--success)' }}>+${p.allowances.toLocaleString()}</td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--danger)' }}>-${(p.deductions + p.advances + p.leaveDeductions).toFixed(2)}</td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>${p.netSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </td>
                  <td>
                    <span className={`badge-chip ${p.status === 'Paid' ? 'success' : p.status === 'Approved' ? 'info' : 'warning'}`}>{p.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelectedPayslip(p)}>
                      View Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payslip Modal View & PDF Print Layout */}
        {selectedPayslip && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '680px', padding: '32px', background: '#fff', color: '#0f172a', borderRadius: '12px' }}>
              {/* Top Controls */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span className="badge-chip info">Official Employee Payslip</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="primary-btn" onClick={handlePrintPayslip}>
                    <Printer width={16} height={16} /> Print / Save as PDF
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} onClick={() => setSelectedPayslip(null)}>
                    <X width={20} height={20} />
                  </button>
                </div>
              </div>

              {/* Printable Payslip Body */}
              <div id="printable-payslip">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>Al-Mansoor Construction LLC</h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Dubai Silicon Oasis, UAE | Trade License: TL-987654</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>PAYSLIP - AUGUST 2026</h3>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Ref: {selectedPayslip.id}</span>
                  </div>
                </div>

                {/* Employee Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem' }}>
                  <div>
                    <strong>Employee Name:</strong> {selectedPayslip.name}
                  </div>
                  <div>
                    <strong>Employee Code:</strong> {selectedPayslip.empCode}
                  </div>
                  <div>
                    <strong>Department:</strong> {selectedPayslip.department}
                  </div>
                  <div>
                    <strong>Designation:</strong> {selectedPayslip.designation}
                  </div>
                  <div>
                    <strong>Normal Hours Worked:</strong> {selectedPayslip.normalHours} hrs
                  </div>
                  <div>
                    <strong>Hourly Rate:</strong> ${selectedPayslip.hourlyRate}/hr
                  </div>
                </div>

                {/* Earnings & Deductions Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', color: '#16a34a' }}>Earnings (Gross)</h4>
                    <table style={{ width: '100%', fontSize: '0.85rem', marginTop: '8px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 0' }}>Basic Salary</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.basicSalary.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0' }}>Allowances (Housing & Transport)</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.allowances.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0' }}>Overtime Pay ({selectedPayslip.overtimeHours} hrs @ 1.25x)</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.overtimePay.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', color: '#dc2626' }}>Deductions & Advances</h4>
                    <table style={{ width: '100%', fontSize: '0.85rem', marginTop: '8px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 0' }}>Salary Advance</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.advances.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0' }}>Leave / Absence Deductions</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.leaveDeductions.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0' }}>Other Deductions</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.deductions.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Net Salary Summary Footer */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>NET PAYABLE AMOUNT</span>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Direct Bank Transfer / WPS Compliant</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>${selectedPayslip.netSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
