'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import Papa from 'papaparse';

interface TimesheetRecord {
  id: string;
  employee_id: string;
  profiles: { employee_id: string | null; full_name: string };
  project_id: string | null;
  projects: { name: string } | null;
  date: string;
  day: string | null;
  time_in: string | null;
  time_out: string | null;
  break_hours: number;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  employee_id: string | null;
  full_name: string;
}

interface Project {
  id: string;
  name: string;
  code: string | null;
}

export default function TimesheetsPage() {
  const [records, setRecords] = useState<TimesheetRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimesheetRecord | null>(null);

  useEffect(() => {
    fetchTimesheets();
    fetchEmployees();
    fetchProjects();
  }, [selectedProject, selectedStatus, dateFilter]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProject !== 'All') params.append('project', selectedProject);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`/api/timesheets?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setRecords(data.timesheets || []);
      } else {
        showNotification('error', data.error || 'Failed to fetch timesheets');
      }
    } catch (error) {
      showNotification('error', 'Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (response.ok) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchProjects = async () => {
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data } = await supabase.from('projects').select('*');
      if (data) setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Form State
  const [formEmpId, setFormEmpId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTimeIn, setFormTimeIn] = useState('08:00');
  const [formTimeOut, setFormTimeOut] = useState('17:00');
  const [formBreak, setFormBreak] = useState(1.0);
  const [formStatus, setFormStatus] = useState('Present');
  const [formNotes, setFormNotes] = useState('');

  // Bulk State
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkProjectId, setBulkProjectId] = useState('');
  const [bulkStatus, setBulkStatus] = useState('Present');
  const [bulkTimeIn, setBulkTimeIn] = useState('08:00');
  const [bulkTimeOut, setBulkTimeOut] = useState('17:00');

  useEffect(() => {
    if (employees.length > 0) {
      setFormEmpId(employees[0].id);
    }
    if (projects.length > 0) {
      setFormProjectId(projects[0].id);
      setBulkProjectId(projects[0].id);
    }
  }, [employees, projects]);

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

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId || !formDate) {
      showNotification('error', 'Employee and date are required');
      return;
    }

    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: formEmpId,
          project_id: formProjectId || null,
          date: formDate,
          time_in: formTimeIn,
          time_out: formTimeOut,
          break_hours: formBreak,
          status: formStatus,
          notes: formNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Attendance recorded successfully');
        setIsAdding(false);
        setIsEditing(false);
        setEditingRecord(null);
        resetForm();
        fetchTimesheets();
      } else {
        showNotification('error', data.error || 'Failed to record attendance');
      }
    } catch (error) {
      showNotification('error', 'Failed to record attendance');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const response = await fetch('/api/timesheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          project_id: formProjectId || null,
          time_in: formTimeIn,
          time_out: formTimeOut,
          break_hours: formBreak,
          status: formStatus,
          notes: formNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Timesheet updated successfully');
        setIsEditing(false);
        setEditingRecord(null);
        resetForm();
        fetchTimesheets();
      } else {
        showNotification('error', data.error || 'Failed to update timesheet');
      }
    } catch (error) {
      showNotification('error', 'Failed to update timesheet');
    }
  };

  const handleSaveBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkDate || employees.length === 0) {
      showNotification('error', 'Date and employees are required');
      return;
    }

    try {
      const promises = employees.map((emp) =>
        fetch('/api/timesheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: emp.id,
            project_id: bulkProjectId || null,
            date: bulkDate,
            time_in: bulkTimeIn,
            time_out: bulkTimeOut,
            break_hours: 1.0,
            status: bulkStatus,
            notes: 'Bulk daily entry',
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;

      if (successful > 0) {
        showNotification('success', `Successfully recorded ${successful} attendance entries`);
        setIsBulk(false);
        fetchTimesheets();
      } else {
        showNotification('error', 'Failed to record bulk attendance');
      }
    } catch (error) {
      showNotification('error', 'Failed to record bulk attendance');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timesheet record?')) return;

    try {
      const response = await fetch(`/api/timesheets?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Timesheet deleted successfully');
        fetchTimesheets();
      } else {
        showNotification('error', data.error || 'Failed to delete timesheet');
      }
    } catch (error) {
      showNotification('error', 'Failed to delete timesheet');
    }
  };

  const openEditModal = (record: TimesheetRecord) => {
    setEditingRecord(record);
    setFormEmpId(record.employee_id);
    setFormProjectId(record.project_id || '');
    setFormDate(record.date);
    setFormTimeIn(record.time_in || '08:00');
    setFormTimeOut(record.time_out || '17:00');
    setFormBreak(record.break_hours);
    setFormStatus(record.status);
    setFormNotes(record.notes || '');
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormEmpId(employees[0]?.id || '');
    setFormProjectId(projects[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTimeIn('08:00');
    setFormTimeOut('17:00');
    setFormBreak(1.0);
    setFormStatus('Present');
    setFormNotes('');
  };

  const exportCSV = () => {
    const csvData = records.map((r) => ({
      'Employee ID': r.profiles.employee_id || 'N/A',
      'Employee Name': r.profiles.full_name,
      Project: r.projects?.name || 'N/A',
      Date: r.date,
      Day: r.day,
      'Time In': r.time_in,
      'Time Out': r.time_out,
      'Break (hrs)': r.break_hours,
      'Total Hours': r.total_hours,
      'Regular Hours': r.regular_hours,
      'Overtime Hours': r.overtime_hours,
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

  const filteredRecords = records;

  const totalHrs = filteredRecords.reduce((acc, curr) => acc + curr.total_hours, 0);
  const totalOT = filteredRecords.reduce((acc, curr) => acc + curr.overtime_hours, 0);

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
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
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
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spin" width={32} height={32} style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
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
                          <strong>{record.profiles.full_name}</strong>
                          <div className="muted" style={{ fontSize: '0.78rem' }}>
                            {record.profiles.employee_id || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>{record.projects?.name || 'N/A'}</td>
                      <td>
                        <div style={{ fontSize: '0.88rem' }}>{record.date}</div>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>
                          {record.day || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {record.status === 'Present' ? (
                          <div style={{ fontSize: '0.88rem' }}>
                            {record.time_in} - {record.time_out}
                          </div>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>{record.break_hours}h</td>
                      <td>
                        <strong>{record.total_hours.toFixed(1)}h</strong>
                      </td>
                      <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{record.regular_hours.toFixed(1)}h</td>
                      <td>
                        {record.overtime_hours > 0 ? (
                          <span className="badge-chip warning" style={{ fontWeight: 700 }}>
                            +{record.overtime_hours.toFixed(1)}h OT
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
                        {record.notes || '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="icon-btn"
                          onClick={() => openEditModal(record)}
                          title="Edit Attendance Record"
                          style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '4px' }}
                        >
                          <Edit width={16} height={16} />
                        </button>
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
        )}

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
              <form onSubmit={isEditing ? handleUpdate : handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Select Employee</label>
                  <select className="form-input" value={formEmpId} onChange={(e) => setFormEmpId(e.target.value)} disabled={isEditing}>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name} ({e.employee_id || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-input" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required disabled={isEditing} />
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
                  <button type="button" className="btn-secondary" onClick={() => { setIsAdding(false); setIsEditing(false); setEditingRecord(null); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    {isEditing ? 'Update Record' : 'Save Record'}
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
                  <select className="form-input" value={bulkProjectId} onChange={(e) => setBulkProjectId(e.target.value)}>
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
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
                  This will generate attendance records for all {employees.length} active employees on the selected date.
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
