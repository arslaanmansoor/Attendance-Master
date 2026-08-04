'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Save,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Briefcase,
  Filter,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import Papa from 'papaparse';

interface TimesheetRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  project: string;
  date: string;
  day: string;
  timeIn: string;
  timeOut: string;
  breakTime: number; // hours
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  status: 'Present' | 'Absent' | 'Leave' | 'Sick Leave' | 'Holiday';
  notes: string;
}

const mockProjects = [
  'Burj Vista Tower Maintenance',
  'Dubai Logistics Warehouse B',
  'Downtown Commercial Plaza',
  'Sharjah Residential Complex',
  'Abu Dhabi Marine Terminal',
];

const mockEmployees = [
  { id: 'EMP-001', name: 'Zayed Al-Mansoori' },
  { id: 'EMP-002', name: 'Rashid Khan' },
  { id: 'EMP-003', name: 'Tariq Mahmoud' },
  { id: 'EMP-004', name: 'Vikram Singh' },
  { id: 'EMP-005', name: 'Carlos Santos' },
];

const mockTimesheets: TimesheetRecord[] = [
  {
    id: 'TS-101',
    employeeName: 'Zayed Al-Mansoori',
    employeeId: 'EMP-001',
    project: 'Burj Vista Tower Maintenance',
    date: '2026-08-03',
    day: 'Monday',
    timeIn: '08:00',
    timeOut: '18:00',
    breakTime: 1.0,
    totalHours: 9.0,
    regularHours: 8.0,
    overtimeHours: 1.0,
    status: 'Present',
    notes: 'Site inspection & HVAC testing',
  },
  {
    id: 'TS-102',
    employeeName: 'Rashid Khan',
    employeeId: 'EMP-002',
    project: 'Dubai Logistics Warehouse B',
    date: '2026-08-03',
    day: 'Monday',
    timeIn: '08:00',
    timeOut: '17:00',
    breakTime: 1.0,
    totalHours: 8.0,
    regularHours: 8.0,
    overtimeHours: 0.0,
    status: 'Present',
    notes: 'Steel framework installation',
  },
  {
    id: 'TS-103',
    employeeName: 'Tariq Mahmoud',
    employeeId: 'EMP-003',
    project: 'Downtown Commercial Plaza',
    date: '2026-08-02',
    day: 'Sunday',
    timeIn: '00:00',
    timeOut: '00:00',
    breakTime: 0,
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    status: 'Holiday',
    notes: 'Weekly Holiday',
  },
  {
    id: 'TS-104',
    employeeName: 'Vikram Singh',
    employeeId: 'EMP-004',
    project: 'Sharjah Residential Complex',
    date: '2026-08-03',
    day: 'Monday',
    timeIn: '08:30',
    timeOut: '19:30',
    breakTime: 1.0,
    totalHours: 10.0,
    regularHours: 8.0,
    overtimeHours: 2.0,
    status: 'Present',
    notes: 'Concrete pouring overtime',
  },
];

export default function TimesheetsPage() {
  const [records, setRecords] = useState<TimesheetRecord[]>(mockTimesheets);
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isBulk, setIsBulk] = useState(false);

  // Form State
  const [formEmpId, setFormEmpId] = useState('EMP-001');
  const [formProject, setFormProject] = useState(mockProjects[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTimeIn, setFormTimeIn] = useState('08:00');
  const [formTimeOut, setFormTimeOut] = useState('17:00');
  const [formBreak, setFormBreak] = useState(1.0);
  const [formStatus, setFormStatus] = useState<'Present' | 'Absent' | 'Leave' | 'Sick Leave' | 'Holiday'>('Present');
  const [formNotes, setFormNotes] = useState('');

  // Bulk State
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkProject, setBulkProject] = useState(mockProjects[0]);
  const [bulkStatus, setBulkStatus] = useState<'Present' | 'Absent' | 'Leave' | 'Sick Leave' | 'Holiday'>('Present');
  const [bulkTimeIn, setBulkTimeIn] = useState('08:00');
  const [bulkTimeOut, setBulkTimeOut] = useState('17:00');

  // Compute calculated hours helper
  const calculateHours = (timeInStr: string, timeOutStr: string, breakHrs: number, statusStr: string) => {
    if (statusStr !== 'Present') {
      return { total: 0, regular: 0, overtime: 0 };
    }
    const [h1, m1] = timeInStr.split(':').map(Number);
    const [h2, m2] = timeOutStr.split(':').map(Number);
    let startMin = h1 * 60 + m1;
    let endMin = h2 * 60 + m2;
    if (endMin < startMin) endMin += 24 * 60; // overnight handling
    const grossHours = (endMin - startMin) / 60;
    const total = Math.max(0, grossHours - breakHrs);
    const regular = Math.min(8.0, total); // Standard 9h shift with 1h break = 8h regular
    const overtime = Math.max(0, total - regular);
    return { total, regular, overtime };
  };

  const getDayName = (dateStr: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = mockEmployees.find((e) => e.id === formEmpId) || mockEmployees[0];
    const day = getDayName(formDate);
    const isSunday = day === 'Sunday';
    const effectiveStatus = isSunday && formStatus === 'Present' ? 'Holiday' : formStatus;

    const { total, regular, overtime } = calculateHours(formTimeIn, formTimeOut, formBreak, effectiveStatus);

    const newRecord: TimesheetRecord = {
      id: `TS-${Date.now().toString().slice(-4)}`,
      employeeName: emp.name,
      employeeId: emp.id,
      project: formProject,
      date: formDate,
      day,
      timeIn: effectiveStatus === 'Present' ? formTimeIn : '00:00',
      timeOut: effectiveStatus === 'Present' ? formTimeOut : '00:00',
      breakTime: effectiveStatus === 'Present' ? formBreak : 0,
      totalHours: total,
      regularHours: regular,
      overtimeHours: overtime,
      status: effectiveStatus,
      notes: formNotes || (isSunday ? 'Weekly Holiday' : ''),
    };

    setRecords([newRecord, ...records]);
    setIsAdding(false);
    setFormNotes('');
  };

  const handleSaveBulk = (e: React.FormEvent) => {
    e.preventDefault();
    const day = getDayName(bulkDate);
    const isSunday = day === 'Sunday';
    const effectiveStatus = isSunday ? 'Holiday' : bulkStatus;
    const { total, regular, overtime } = calculateHours(bulkTimeIn, bulkTimeOut, 1.0, effectiveStatus);

    const newEntries: TimesheetRecord[] = mockEmployees.map((emp) => ({
      id: `TS-${Date.now()}-${emp.id}`,
      employeeName: emp.name,
      employeeId: emp.id,
      project: bulkProject,
      date: bulkDate,
      day,
      timeIn: effectiveStatus === 'Present' ? bulkTimeIn : '00:00',
      timeOut: effectiveStatus === 'Present' ? bulkTimeOut : '00:00',
      breakTime: effectiveStatus === 'Present' ? 1.0 : 0,
      totalHours: total,
      regularHours: regular,
      overtimeHours: overtime,
      status: effectiveStatus,
      notes: 'Bulk daily entry',
    }));

    setRecords([...newEntries, ...records]);
    setIsBulk(false);
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  const exportCSV = () => {
    const csvData = records.map((r) => ({
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      Project: r.project,
      Date: r.date,
      Day: r.day,
      'Time In': r.timeIn,
      'Time Out': r.timeOut,
      'Break (hrs)': r.breakTime,
      'Total Hours': r.totalHours,
      'Regular Hours': r.regularHours,
      'Overtime Hours': r.overtimeHours,
      Status: r.status,
      Notes: r.notes,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timesheets_${Date.now()}.csv`;
    link.click();
  };

  const filteredRecords = records.filter((r) => {
    if (selectedProject !== 'All' && r.project !== selectedProject) return false;
    if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
    if (dateFilter && r.date !== dateFilter) return false;
    return true;
  });

  const totalHrs = filteredRecords.reduce((acc, curr) => acc + curr.totalHours, 0);
  const totalOT = filteredRecords.reduce((acc, curr) => acc + curr.overtimeHours, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header Navigation */}
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
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Timesheet & Attendance Logs</h1>
            <p className="muted" style={{ marginTop: '4px' }}>
              Manual daily attendance entry, automated break deduction (1h), standard 9h working day, and overtime tracking.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setIsBulk(true)}>
              <Users width={16} height={16} /> Bulk Daily Entry
            </button>
            <button className="primary-btn" onClick={() => setIsAdding(true)}>
              <Plus width={16} height={16} /> Record Attendance
            </button>
            <button className="btn-secondary" onClick={exportCSV}>
              <FileSpreadsheet width={16} height={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid" style={{ marginBottom: '28px' }}>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Total Working Hours</div>
              <Clock width={20} height={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="kpi-value">{totalHrs.toFixed(1)} hrs</div>
            <div className="kpi-trend">Filtered dataset</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Total Overtime Hours</div>
              <Sparkles width={20} height={20} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="kpi-value">{totalOT.toFixed(1)} hrs</div>
            <div className="kpi-trend">1.25x / 1.5x multiplier</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Present Count</div>
              <CheckCircle2 width={20} height={20} style={{ color: 'var(--success)' }} />
            </div>
            <div className="kpi-value">{filteredRecords.filter((r) => r.status === 'Present').length}</div>
            <div className="kpi-trend">Active workforce</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Standard Working Shift</div>
              <Briefcase width={20} height={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="kpi-value">9.0 Hours</div>
            <div className="kpi-trend">8h Net + 1h Break</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter width={16} height={16} className="muted" />
            <strong style={{ fontSize: '0.9rem' }}>Filters:</strong>
          </div>
          <div>
            <select className="form-input" style={{ width: 'auto' }} value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              <option value="All">All Projects</option>
              {mockProjects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select className="form-input" style={{ width: 'auto' }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
          <div>
            <input type="date" className="form-input" style={{ width: 'auto' }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>
          {dateFilter && (
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setDateFilter('')}>
              Clear Date
            </button>
          )}
        </div>

        {/* Timesheets Table */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Project</th>
                <th>Date & Day</th>
                <th>Time In / Out</th>
                <th>Break</th>
                <th>Total Hrs</th>
                <th>Regular</th>
                <th>Overtime</th>
                <th>Status</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div>
                        <strong>{record.employeeName}</strong>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>
                          {record.employeeId}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.88rem' }}>{record.project}</td>
                    <td>
                      <div style={{ fontSize: '0.88rem' }}>{record.date}</div>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {record.day}
                      </div>
                    </td>
                    <td>
                      {record.status === 'Present' ? (
                        <div style={{ fontSize: '0.88rem' }}>
                          {record.timeIn} - {record.timeOut}
                        </div>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.88rem' }}>{record.breakTime}h</td>
                    <td>
                      <strong>{record.totalHours.toFixed(1)}h</strong>
                    </td>
                    <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{record.regularHours.toFixed(1)}h</td>
                    <td>
                      {record.overtimeHours > 0 ? (
                        <span className="badge-chip warning" style={{ fontWeight: 700 }}>
                          +{record.overtimeHours.toFixed(1)}h OT
                        </span>
                      ) : (
                        <span className="muted">0.0h</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge-chip ${
                          record.status === 'Present'
                            ? 'success'
                            : record.status === 'Holiday'
                            ? 'info'
                            : record.status === 'Sick Leave' || record.status === 'Leave'
                            ? 'warning'
                            : 'danger'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }} className="muted">
                      {record.notes}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="icon-btn danger"
                        onClick={() => handleDelete(record.id)}
                        title="Delete Attendance Record"
                        style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                      >
                        <Trash2 width={16} height={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Record Attendance Modal */}
        {isAdding && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Record Daily Attendance</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsAdding(false)}>
                  <X width={20} height={20} />
                </button>
              </div>
              <form onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Select Employee</label>
                  <select className="form-input" value={formEmpId} onChange={(e) => setFormEmpId(e.target.value)}>
                    {mockEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-input" value={formProject} onChange={(e) => setFormProject(e.target.value)}>
                    {mockProjects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Attendance Status</label>
                    <select className="form-input" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Leave">Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Holiday">Holiday</option>
                    </select>
                  </div>
                </div>

                {formStatus === 'Present' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">Time In</label>
                      <input type="time" className="form-input" value={formTimeIn} onChange={(e) => setFormTimeIn(e.target.value)} required />
                    </div>
                    <div>
                      <label className="form-label">Time Out</label>
                      <input type="time" className="form-input" value={formTimeOut} onChange={(e) => setFormTimeOut(e.target.value)} required />
                    </div>
                    <div>
                      <label className="form-label">Break (Hours)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="form-input"
                        value={formBreak}
                        onChange={(e) => setFormBreak(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Notes & Remarks</label>
                  <input type="text" className="form-input" placeholder="e.g. Overtime requested by supervisor" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Attendance Modal */}
        {isBulk && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bulk Daily Attendance Entry</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsBulk(false)}>
                  <X width={20} height={20} />
                </button>
              </div>
              <form onSubmit={handleSaveBulk} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Project Location</label>
                  <select className="form-input" value={bulkProject} onChange={(e) => setBulkProject(e.target.value)}>
                    {mockProjects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Target Date</label>
                    <input type="date" className="form-input" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Bulk Status</label>
                    <select className="form-input" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as any)}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Holiday">Holiday</option>
                    </select>
                  </div>
                </div>

                {bulkStatus === 'Present' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">Time In</label>
                      <input type="time" className="form-input" value={bulkTimeIn} onChange={(e) => setBulkTimeIn(e.target.value)} required />
                    </div>
                    <div>
                      <label className="form-label">Time Out</label>
                      <input type="time" className="form-input" value={bulkTimeOut} onChange={(e) => setBulkTimeOut(e.target.value)} required />
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.85rem' }} className="muted">
                  This will generate attendance records for all {mockEmployees.length} active employees on the selected date.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsBulk(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Generate Bulk Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
