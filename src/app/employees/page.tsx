'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Filter,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  Building,
  MoreVertical,
  UserPlus,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';

interface Employee {
  id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  position: string | null;
  phone: string | null;
  departments: { id: string; name: string; code: string } | null;
  companies: { id: string; name: string } | null;
  employment_status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  joining_date: string | null;
  basic_salary: number;
  hourly_rate: number;
  nationality: string | null;
  passport_id: string | null;
  visa_expiry: string | null;
  employment_type: string | null;
  overtime_rate: number;
  working_hours_per_day: number;
  weekly_off_day: string | null;
  notes: string | null;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Company {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New employee form state
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    department_id: '',
    company_id: '',
    position: '',
    phone: '',
    nationality: '',
    passport_id: '',
    visa_expiry: '',
    employment_type: 'Full-time',
    joining_date: new Date().toISOString().split('T')[0],
    basic_salary: '',
    hourly_rate: '',
    overtime_rate: '',
    working_hours_per_day: '8',
    weekly_off_day: 'Sunday',
    notes: '',
    employment_status: 'Active' as 'Active' | 'Inactive' | 'On Leave' | 'Terminated',
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchCompanies();
  }, [departmentFilter, statusFilter, search]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (departmentFilter !== 'All') params.append('department', departmentFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/employees?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEmployees(data.employees || []);
      } else {
        showNotification('error', data.error || 'Failed to fetch employees');
      }
    } catch (error) {
      showNotification('error', 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchCompanies = async () => {
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data, error } = await supabase.from('companies').select('*');
      if (error) {
        console.error('Failed to fetch companies:', error);
        showNotification('error', 'Failed to load companies');
      } else if (data) {
        setCompanies(data);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredEmployees = useMemo(() => {
    return employees;
  }, [employees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.employee_id) {
      showNotification('error', 'Employee ID is required');
      return;
    }
    if (!formData.full_name) {
      showNotification('error', 'Employee Name is required');
      return;
    }
    if (!formData.email) {
      showNotification('error', 'Email is required');
      return;
    }
    if (!formData.company_id) {
      showNotification('error', 'Company is required');
      return;
    }
    if (!formData.department_id) {
      showNotification('error', 'Department is required');
      return;
    }
    if (!formData.position) {
      showNotification('error', 'Position is required');
      return;
    }

    // Check if Employee ID already exists
    const existingEmployee = employees.find(emp => emp.employee_id === formData.employee_id);
    if (existingEmployee) {
      showNotification('error', 'Employee ID already exists');
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmAddEmployee = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          basic_salary: parseFloat(formData.basic_salary) || 0,
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
          overtime_rate: parseFloat(formData.overtime_rate) || 0,
          working_hours_per_day: parseFloat(formData.working_hours_per_day) || 8,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Employee added successfully');
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
      } else {
        showNotification('error', data.error || 'Unable to save employee');
      }
    } catch (error) {
      showNotification('error', 'Please check database connection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEmployee.id,
          ...formData,
          basic_salary: parseFloat(formData.basic_salary) || 0,
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Employee updated successfully');
        setShowEditModal(false);
        setEditingEmployee(null);
        resetForm();
        fetchEmployees();
      } else {
        showNotification('error', data.error || 'Failed to update employee');
      }
    } catch (error) {
      showNotification('error', 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
      setEmployeeToDelete(employee);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    setShowDeleteModal(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: employeeToDelete.id }),
      });

      if (response.ok) {
        showNotification('success', 'Employee deleted successfully');
        fetchEmployees();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Unable to delete employee');
      }
    } catch (error) {
      showNotification('error', 'Please check database connection');
    } finally {
      setIsSaving(false);
      setEmployeeToDelete(null);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id || '',
      full_name: employee.full_name,
      email: employee.email,
      role: employee.role,
      department_id: employee.departments?.id || '',
      company_id: employee.companies?.id || '',
      position: employee.position || '',
      phone: employee.phone || '',
      nationality: employee.nationality || '',
      passport_id: employee.passport_id || '',
      visa_expiry: employee.visa_expiry || '',
      employment_type: employee.employment_type || 'Full-time',
      joining_date: employee.joining_date || new Date().toISOString().split('T')[0],
      basic_salary: employee.basic_salary.toString(),
      hourly_rate: employee.hourly_rate.toString(),
      overtime_rate: employee.overtime_rate.toString(),
      working_hours_per_day: employee.working_hours_per_day.toString(),
      weekly_off_day: employee.weekly_off_day || 'Sunday',
      notes: employee.notes || '',
      employment_status: employee.employment_status,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      full_name: '',
      email: '',
      role: 'employee',
      department_id: '',
      company_id: '',
      position: '',
      phone: '',
      nationality: '',
      passport_id: '',
      visa_expiry: '',
      employment_type: 'Full-time',
      joining_date: new Date().toISOString().split('T')[0],
      basic_salary: '',
      hourly_rate: '',
      overtime_rate: '',
      working_hours_per_day: '8',
      weekly_off_day: 'Sunday',
      notes: '',
      employment_status: 'Active',
    });
  };

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
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Employee Directory</h1>
            <p className="muted" style={{ marginTop: '4px' }}>
              Manage team members, roles, department assignments, and live status.
            </p>
          </div>

          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            <UserPlus width={16} height={16} /> Add New Employee
          </button>
        </div>

        {/* Filters and Controls */}
        <div
          className="card"
          style={{
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="search" style={{ minWidth: '280px', flex: 1 }}>
            <Search width={18} height={18} style={{ color: 'var(--muted)' }} />
            <input
              type="search"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="muted" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter width={16} height={16} /> Department:
            </span>
            <div className="segmented">
              <button
                type="button"
                className={departmentFilter === 'All' ? 'active' : ''}
                onClick={() => setDepartmentFilter('All')}
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                All
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  className={departmentFilter === dept.code ? 'active' : ''}
                  onClick={() => setDepartmentFilter(dept.code)}
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  {dept.name}
                </button>
              ))}
            </div>
            <span className="muted" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px' }}>
              Status:
            </span>
            <div className="segmented">
              {['All', 'Active', 'Inactive', 'On Leave'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={statusFilter === status ? 'active' : ''}
                  onClick={() => setStatusFilter(status)}
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Cards Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spin" width={32} height={32} style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getInitials(emp.full_name)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{emp.full_name}</h3>
                      <div className="muted" style={{ fontSize: '0.82rem' }}>{emp.position || 'No position'}</div>
                    </div>
                  </div>

                  <span
                    className={`badge-chip ${
                      emp.employment_status === 'Active' ? 'success' : emp.employment_status === 'On Leave' ? 'warning' : 'danger'
                    }`}
                  >
                    {emp.employment_status}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="muted">
                    <Mail width={14} height={14} /> {emp.email}
                  </div>
                  {emp.employee_id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="muted">
                      <ShieldCheck width={14} height={14} /> ID: <strong style={{ color: 'var(--text)' }}>{emp.employee_id}</strong>
                    </div>
                  )}
                  {emp.departments && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="muted">
                      <Building width={14} height={14} /> Department: <strong style={{ color: 'var(--text)' }}>{emp.departments.name}</strong>
                    </div>
                  )}
                  {emp.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="muted">
                      <Phone width={14} height={14} /> {emp.phone}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', gap: '8px' }}>
                  <span className="pill" style={{ fontSize: '0.75rem' }}>
                    Role: {emp.role}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="icon-btn"
                      onClick={() => openEditModal(emp)}
                      title="Edit Employee"
                      style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                    >
                      <Edit width={16} height={16} />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => handleDeleteEmployee(emp.id)}
                      title="Delete Employee"
                      style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    >
                      <Trash2 width={16} height={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

        {/* Modal: Add Employee */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="card"
              style={{ width: '90%', maxWidth: '480px', padding: '28px', background: 'var(--surface)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Employee</h3>
                <button className="icon-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X width={18} height={18} />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-001"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      value={formData.employment_status}
                      onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as any })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Department
                    </label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Company
                    </label>
                    <select
                      value={formData.company_id}
                      onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="">Select Company</option>
                      {companies.length === 0 ? (
                        <option value="" disabled>No companies found</option>
                      ) : (
                        companies.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))
                      )}
                    </select>
                    {companies.length === 0 && (
                      <p className="muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                        No company found. <Link href="/company" style={{ color: 'var(--primary)' }}>+ Add Company</Link>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Job Title / Position
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Specialist"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Nationality
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UAE"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Passport / ID Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A12345678"
                      value={formData.passport_id}
                      onChange={(e) => setFormData({ ...formData, passport_id: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Visa Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.visa_expiry}
                      onChange={(e) => setFormData({ ...formData, visa_expiry: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Employment Type
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Basic Salary
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Overtime Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Working Hours Per Day
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="8"
                      value={formData.working_hours_per_day}
                      onChange={(e) => setFormData({ ...formData, working_hours_per_day: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Weekly Off Day
                    </label>
                    <select
                      value={formData.weekly_off_day}
                      onChange={(e) => setFormData({ ...formData, weekly_off_day: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="Sunday">Sunday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Friday">Friday</option>
                      <option value="Monday">Monday</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Additional notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="ghost-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="spin" width={16} height={16} style={{ marginRight: '8px' }} />
                        Saving...
                      </>
                    ) : (
                      'Confirm & Save Employee'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              className="card"
              style={{ width: '90%', maxWidth: '450px', padding: '28px', background: 'var(--surface)' }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Add New Employee</h3>
              <p className="muted" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>
                Are you sure you want to add this employee?
              </p>
              
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '8px' }}><strong>Employee ID:</strong> {formData.employee_id}</div>
                <div style={{ marginBottom: '8px' }}><strong>Employee Name:</strong> {formData.full_name}</div>
                <div style={{ marginBottom: '8px' }}><strong>Company:</strong> {companies.find(c => c.id === formData.company_id)?.name || 'Not selected'}</div>
                <div style={{ marginBottom: '8px' }}><strong>Department:</strong> {departments.find(d => d.id === formData.department_id)?.name || 'Not selected'}</div>
                <div><strong>Position:</strong> {formData.position || 'Not specified'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  className="ghost-btn"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="primary-btn"
                  onClick={confirmAddEmployee}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="spin" width={16} height={16} style={{ marginRight: '8px' }} />
                      Confirming...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && employeeToDelete && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              className="card"
              style={{ width: '90%', maxWidth: '400px', padding: '28px', background: 'var(--surface)' }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--danger)' }}>Delete Employee</h3>
              <p className="muted" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
              
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '8px' }}><strong>Employee ID:</strong> {employeeToDelete.employee_id || 'N/A'}</div>
                <div style={{ marginBottom: '8px' }}><strong>Employee Name:</strong> {employeeToDelete.full_name}</div>
                <div><strong>Email:</strong> {employeeToDelete.email}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  className="ghost-btn"
                  onClick={() => { setShowDeleteModal(false); setEmployeeToDelete(null); }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="danger-btn"
                  onClick={confirmDeleteEmployee}
                  disabled={isSaving}
                  style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="spin" width={16} height={16} style={{ marginRight: '8px' }} />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Employee */}
        {showEditModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
            }}
            onClick={() => { setShowEditModal(false); setEditingEmployee(null); resetForm(); }}
          >
            <div
              className="card"
              style={{ width: '90%', maxWidth: '580px', padding: '28px', background: 'var(--surface)', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Employee</h3>
                <button className="icon-btn" onClick={() => { setShowEditModal(false); setEditingEmployee(null); resetForm(); }}>
                  <X width={18} height={18} />
                </button>
              </div>

              <form onSubmit={handleEditEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-001"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      value={formData.employment_status}
                      onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as any })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Department
                    </label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Company
                    </label>
                    <select
                      value={formData.company_id}
                      onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="">Select Company</option>
                      {companies.length === 0 ? (
                        <option value="" disabled>No companies found</option>
                      ) : (
                        companies.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))
                      )}
                    </select>
                    {companies.length === 0 && (
                      <p className="muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                        No company found. <Link href="/company" style={{ color: 'var(--primary)' }}>+ Add Company</Link>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Job Title / Position
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Specialist"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Nationality
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UAE"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Passport / ID Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A12345678"
                      value={formData.passport_id}
                      onChange={(e) => setFormData({ ...formData, passport_id: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Visa Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.visa_expiry}
                      onChange={(e) => setFormData({ ...formData, visa_expiry: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Employment Type
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Basic Salary
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Overtime Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Working Hours Per Day
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="8"
                      value={formData.working_hours_per_day}
                      onChange={(e) => setFormData({ ...formData, working_hours_per_day: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Weekly Off Day
                    </label>
                    <select
                      value={formData.weekly_off_day}
                      onChange={(e) => setFormData({ ...formData, weekly_off_day: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="Sunday">Sunday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Friday">Friday</option>
                      <option value="Monday">Monday</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Additional notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="ghost-btn" onClick={() => { setShowEditModal(false); setEditingEmployee(null); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Update Employee
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
