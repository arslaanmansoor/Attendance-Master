'use client';

import React, { useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';

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

interface ReportData {
  empCode?: string;
  empName?: string;
  project?: string;
  date?: string;
  presentDays?: number;
  overtimeHrs?: number;
  basicSalary?: number;
  netPay?: number;
  status?: string;
  [key: string]: any;
}

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

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('emp_attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeReportConfig = reportOptions.find((r) => r.key === selectedReport);

  // Fetch report data based on selected report type
  useEffect(() => {
    fetchReportData();
  }, [selectedReport, startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      let data: ReportData[] = [];

      switch (selectedReport) {
        case 'emp_attendance':
        case 'daily_attendance':
          {
            const { data: attendance } = await supabase
              .from('attendance_logs')
              .select(`
                *,
                profiles!inner(employee_id, full_name, position)
              `)
              .gte('date', startDate)
              .lte('date', endDate)
              .order('date', { ascending: false });
            
            data = (attendance || []).map((item: any) => ({
              empCode: item.profiles.employee_id,
              empName: item.profiles.full_name,
              date: item.date,
              timeIn: item.time_in,
              timeOut: item.time_out,
              totalHours: item.total_hours,
              regularHours: item.regular_hours,
              overtimeHrs: item.overtime_hours,
              status: item.status,
            }));
          }
          break;

        case 'emp_payroll':
          {
            const { data: payroll } = await supabase
              .from('payroll_items')
              .select(`
                *,
                profiles!inner(employee_id, full_name, position, basic_salary),
                payroll_runs!inner(title, period_start, period_end)
              `)
              .gte('created_at', startDate)
              .lte('created_at', endDate)
              .order('created_at', { ascending: false });
            
            data = (payroll || []).map((item: any) => ({
              empCode: item.profiles.employee_id,
              empName: item.profiles.full_name,
              payrollRun: item.payroll_runs.title,
              period: `${item.payroll_runs.period_start} to ${item.payroll_runs.period_end}`,
              basicSalary: item.base_salary,
              normalHours: item.normal_hours,
              overtimeHrs: item.overtime_hours,
              overtimePay: item.overtime_pay,
              allowances: item.allowances,
              deductions: item.deductions,
              netPay: item.net_salary,
              status: item.status,
            }));
          }
          break;

        case 'monthly_attendance':
          {
            const { data: attendance } = await supabase
              .from('attendance_logs')
              .select(`
                employee_id,
                profiles!inner(employee_id, full_name),
                date,
                total_hours,
                regular_hours,
                overtime_hours,
                status
              `)
              .gte('date', startDate)
              .lte('date', endDate);
            
            // Group by employee
            const grouped = (attendance || []).reduce((acc: any, item: any) => {
              const key = item.employee_id;
              if (!acc[key]) {
                acc[key] = {
                  empCode: item.profiles.employee_id,
                  empName: item.profiles.full_name,
                  totalHours: 0,
                  regularHours: 0,
                  overtimeHrs: 0,
                  presentDays: 0,
                  absentDays: 0,
                };
              }
              acc[key].totalHours += item.total_hours || 0;
              acc[key].regularHours += item.regular_hours || 0;
              acc[key].overtimeHrs += item.overtime_hours || 0;
              if (item.status === 'Present') acc[key].presentDays++;
              if (item.status === 'Absent') acc[key].absentDays++;
              return acc;
            }, {});
            
            data = Object.values(grouped);
          }
          break;

        case 'overtime_report':
          {
            const { data: attendance } = await supabase
              .from('attendance_logs')
              .select(`
                *,
                profiles!inner(employee_id, full_name, position)
              `)
              .gte('date', startDate)
              .lte('date', endDate)
              .gt('overtime_hours', 0)
              .order('overtime_hours', { ascending: false });
            
            data = (attendance || []).map((item: any) => ({
              empCode: item.profiles.employee_id,
              empName: item.profiles.full_name,
              position: item.profiles.position,
              date: item.date,
              totalHours: item.total_hours,
              regularHours: item.regular_hours,
              overtimeHrs: item.overtime_hours,
            }));
          }
          break;

        case 'leave_report':
          {
            const { data: leaves } = await supabase
              .from('leave_requests')
              .select(`
                *,
                profiles!inner(employee_id, full_name)
              `)
              .gte('start_date', startDate)
              .lte('end_date', endDate)
              .order('created_at', { ascending: false });
            
            data = (leaves || []).map((item: any) => ({
              empCode: item.profiles.employee_id,
              empName: item.profiles.full_name,
              leaveType: item.leave_type,
              startDate: item.start_date,
              endDate: item.end_date,
              reason: item.reason,
              status: item.status,
            }));
          }
          break;

        default:
          // For other report types, return empty array for now
          data = [];
      }

      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reportData.filter((item) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        (item.empName && item.empName.toLowerCase().includes(searchLower)) ||
        (item.project && item.project.toLowerCase().includes(searchLower)) ||
        (item.empCode && item.empCode.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }
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
              Generate, filter, print, and export comprehensive reports from real database data.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }} className="no-print">
            <button className="btn-secondary" onClick={handlePrint} disabled={loading}>
              <Printer width={16} height={16} /> Print Report
            </button>
            <button className="primary-btn" onClick={exportCSV} disabled={loading || filteredData.length === 0}>
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
                <button className="btn-secondary" onClick={fetchReportData} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Generated Report Content Area */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeReportConfig?.label}</h2>
                  <p className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    Period: {startDate} to {endDate}
                  </p>
                </div>
                <span className="badge-chip info">{activeReportConfig?.category}</span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p className="muted">Loading report data...</p>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--danger)' }}>{error}</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p className="muted">No data found for the selected report type and date range.</p>
                </div>
              ) : (
                /* Data Table */
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {Object.keys(filteredData[0]).map((key) => (
                          <th key={key} style={{ textTransform: 'capitalize' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, cellIdx) => (
                            <td key={cellIdx}>
                              {typeof value === 'number' && (keyIncludes(['salary', 'pay', 'hours'], Object.keys(row)[cellIdx])) 
                                ? (keyIncludes(['salary', 'pay'], Object.keys(row)[cellIdx]) 
                                    ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                    : `${value.toFixed(2)} hrs`)
                                : value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function keyIncludes(arr: string[], key: string): boolean {
  return arr.some(k => key.toLowerCase().includes(k));
}
