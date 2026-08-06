'use client';

import React, { useState, useEffect } from 'react';
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
  Plus,
  Loader2,
} from 'lucide-react';
import Papa from 'papaparse';

interface PayrollRun {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  total_employees: number;
  status: string;
  approved_by: string | null;
  profiles: { full_name: string } | null;
  approved_at: string | null;
  created_at: string;
}

interface PayrollItem {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  profiles: { employee_id: string | null; full_name: string; position: string | null; departments: { name: string } | null };
  base_salary: number;
  hourly_rate: number;
  normal_hours: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  advances: number;
  leave_deductions: number;
  net_salary: number;
  status: string;
  created_at: string;
}

export default function PayrollPage() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Generate payroll form state
  const [generateForm, setGenerateForm] = useState({
    title: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPayrollRuns();
  }, []);

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payroll');
      const data = await response.json();

      if (response.ok) {
        setPayrollRuns(data.payrollRuns || []);
      } else {
        showNotification('error', data.error || 'Failed to fetch payroll runs');
      }
    } catch (error) {
      showNotification('error', 'Failed to fetch payroll runs');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollItems = async (runId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll?payrollRunId=${runId}`);
      const data = await response.json();

      if (response.ok) {
        setPayrollItems(data.payrollItems || []);
      } else {
        showNotification('error', data.error || 'Failed to fetch payroll items');
      }
    } catch (error) {
      showNotification('error', 'Failed to fetch payroll items');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const totalNet = payrollItems.reduce((acc: number, curr: PayrollItem) => acc + curr.net_salary, 0);
  const totalOvertime = payrollItems.reduce((acc: number, curr: PayrollItem) => acc + curr.overtime_pay, 0);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateForm.title || !generateForm.period_start || !generateForm.period_end) {
      showNotification('error', 'All fields are required');
      return;
    }

    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateForm),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Payroll generated successfully');
        setShowGenerateModal(false);
        setGenerateForm({
          title: '',
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
        });
        fetchPayrollRuns();
      } else {
        showNotification('error', data.error || 'Failed to generate payroll');
      }
    } catch (error) {
      showNotification('error', 'Failed to generate payroll');
    }
  };

  const handleUpdateStatus = async (runId: string, status: string) => {
    try {
      const response = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payroll_run', id: runId, status }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Payroll status updated');
        fetchPayrollRuns();
      } else {
        showNotification('error', data.error || 'Failed to update status');
      }
    } catch (error) {
      showNotification('error', 'Failed to update status');
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (!confirm('Are you sure you want to delete this payroll run?')) return;

    try {
      const response = await fetch(`/api/payroll?type=payroll_run&id=${runId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Payroll run deleted');
        if (selectedRun?.id === runId) {
          setSelectedRun(null);
          setPayrollItems([]);
        }
        fetchPayrollRuns();
      } else {
        showNotification('error', data.error || 'Failed to delete payroll run');
      }
    } catch (error) {
      showNotification('error', 'Failed to delete payroll run');
    }
  };

  const exportCSV = () => {
    const csvData = payrollItems.map((p: PayrollItem) => ({
      'Employee ID': p.profiles.employee_id || 'N/A',
      Name: p.profiles.full_name,
      Position: p.profiles.position || 'N/A',
      Department: p.profiles.departments?.name || 'N/A',
      'Basic Salary': p.base_salary,
      'Hourly Rate': p.hourly_rate,
      'Normal Hours': p.normal_hours,
      'Overtime Hours': p.overtime_hours,
      'Overtime Pay': p.overtime_pay,
      Allowances: p.allowances,
      Bonuses: p.bonuses,
      Deductions: p.deductions,
      Advances: p.advances,
      'Leave Deductions': p.leave_deductions,
      'Net Salary': p.net_salary,
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
            <button className="primary-btn" onClick={exportCSV} disabled={!selectedRun}>
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
            <div className="kpi-trend">{selectedRun ? `For ${selectedRun.title}` : 'Select a payroll run'}</div>
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
            <div className="kpi-value">{payrollItems.length}</div>
            <div className="kpi-trend">Download & Printable PDF</div>
          </div>
        </div>

        {/* Payroll Runs Selection */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Payroll Runs</h3>
            <button className="primary-btn" onClick={() => setShowGenerateModal(true)}>
              <Plus width={16} height={16} /> Generate New Payroll
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {payrollRuns.map((run) => (
              <div
                key={run.id}
                className={`card ${selectedRun?.id === run.id ? 'selected' : ''}`}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: selectedRun?.id === run.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                }}
                onClick={() => {
                  setSelectedRun(run);
                  fetchPayrollItems(run.id);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{run.title}</strong>
                  <span className={`badge-chip ${run.status === 'Approved' || run.status === 'Disbursed' ? 'success' : run.status === 'Draft' ? 'warning' : 'info'}`}>
                    {run.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem' }} className="muted">
                  {run.period_start} to {run.period_end}
                </div>
                <div style={{ fontSize: '0.82rem' }} className="muted">
                  {run.total_employees} employees • ${run.total_amount.toLocaleString()}
                </div>
                {selectedRun?.id === run.id && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    {run.status === 'Draft' && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(run.id, 'Approved'); }}
                      >
                        Approve
                      </button>
                    )}
                    {run.status === 'Approved' && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(run.id, 'Disbursed'); }}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      className="icon-btn danger"
                      style={{ padding: '4px', fontSize: '0.75rem' }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteRun(run.id); }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payroll Summary Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spin" width={32} height={32} style={{ color: 'var(--primary)' }} />
          </div>
        ) : selectedRun ? (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
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
                {payrollItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                      No payroll items found for this run.
                    </td>
                  </tr>
                ) : (
                  payrollItems.map((p) => (
                    <tr key={p.id}>
                      <td>
                    <strong>{p.profiles.employee_id || 'N/A'}</strong>
                  </td>
                  <td>
                    <div>
                      <strong>{p.profiles.full_name}</strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {p.profiles.position || 'N/A'} ({p.profiles.departments?.name || 'N/A'})
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.88rem' }}>${p.base_salary.toLocaleString()}</td>
                  <td style={{ fontSize: '0.88rem' }}>${p.hourly_rate}/hr</td>
                  <td style={{ fontSize: '0.88rem' }}>
                    {p.normal_hours}h / <span style={{ color: 'var(--warning)', fontWeight: 600 }}>+{p.overtime_hours}h</span>
                  </td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--warning)', fontWeight: 600 }}>+${p.overtime_pay.toFixed(2)}</td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--success)' }}>+${p.allowances.toLocaleString()}</td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--danger)' }}>-${(p.deductions + p.advances + p.leave_deductions).toFixed(2)}</td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>${p.net_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card muted" style={{ padding: '40px', textAlign: 'center' }}>
            Select a payroll run to view details
          </div>
        )}

        {/* Generate Payroll Modal */}
        {showGenerateModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Generate New Payroll</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowGenerateModal(false)}>
                  <X width={20} height={20} />
                </button>
              </div>
              <form onSubmit={handleGeneratePayroll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Payroll Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. August 2026 Payroll Run"
                    value={generateForm.title}
                    onChange={(e) => setGenerateForm({ ...generateForm, title: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Period Start
                    </label>
                    <input
                      type="date"
                      value={generateForm.period_start}
                      onChange={(e) => setGenerateForm({ ...generateForm, period_start: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Period End
                    </label>
                    <input
                      type="date"
                      value={generateForm.period_end}
                      onChange={(e) => setGenerateForm({ ...generateForm, period_end: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem' }} className="muted">
                  This will generate payroll for all active employees based on their timesheet data for the selected period.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="ghost-btn" onClick={() => setShowGenerateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Generate Payroll
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>PAYSLIP - {selectedRun?.title || 'N/A'}</h3>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Ref: {selectedPayslip.id}</span>
                  </div>
                </div>

                {/* Employee Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem' }}>
                  <div>
                    <strong>Employee Name:</strong> {selectedPayslip.profiles.full_name}
                  </div>
                  <div>
                    <strong>Employee Code:</strong> {selectedPayslip.profiles.employee_id || 'N/A'}
                  </div>
                  <div>
                    <strong>Department:</strong> {selectedPayslip.profiles.departments?.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Designation:</strong> {selectedPayslip.profiles.position || 'N/A'}
                  </div>
                  <div>
                    <strong>Normal Hours Worked:</strong> {selectedPayslip.normal_hours} hrs
                  </div>
                  <div>
                    <strong>Hourly Rate:</strong> ${selectedPayslip.hourly_rate}/hr
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
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.base_salary.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0' }}>Allowances (Housing & Transport)</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.allowances.toFixed(2)}</td>
                        </tr>
                        {selectedPayslip.bonuses > 0 && (
                          <tr>
                            <td style={{ padding: '4px 0' }}>Bonuses</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.bonuses.toFixed(2)}</td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ padding: '4px 0' }}>Overtime Pay ({selectedPayslip.overtime_hours} hrs @ 1.25x)</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.overtime_pay.toFixed(2)}</td>
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
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${selectedPayslip.leave_deductions.toFixed(2)}</td>
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
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>${selectedPayslip.net_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '16px 24px',
              borderRadius: '8px',
              background: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
              color: '#fff',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
}
