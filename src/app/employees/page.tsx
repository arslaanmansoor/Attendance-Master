'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  department: 'Operations' | 'Engineering' | 'Finance' | 'Design & Product';
  position: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  checkIn: string;
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Alicia Chen', avatar: 'AC', email: 'alicia.chen@company.com', role: 'Admin', department: 'Operations', position: 'VP of HR Operations', status: 'Active', checkIn: '08:54 AM' },
  { id: '2', name: 'Marcus Lee', avatar: 'ML', email: 'marcus.lee@company.com', role: 'Manager', department: 'Engineering', position: 'Lead Software Engineer', status: 'On Leave', checkIn: 'On Leave' },
  { id: '3', name: 'Diana Ortiz', avatar: 'DO', email: 'diana.ortiz@company.com', role: 'Employee', department: 'Finance', position: 'Financial Analyst', status: 'Active', checkIn: '09:02 AM' },
  { id: '4', name: 'James Taylor', avatar: 'JT', email: 'james.taylor@company.com', role: 'Manager', department: 'Design & Product', position: 'Product Designer', status: 'Active', checkIn: '08:45 AM' },
  { id: '5', name: 'Sophia Wang', avatar: 'SW', email: 'sophia.wang@company.com', role: 'Employee', department: 'Engineering', position: 'Frontend Developer', status: 'Active', checkIn: '08:58 AM' },
  { id: '6', name: 'David Miller', avatar: 'DM', email: 'david.miller@company.com', role: 'Employee', department: 'Operations', position: 'Logistics Coordinator', status: 'Inactive', checkIn: 'Absent' },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New employee form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState<'Operations' | 'Engineering' | 'Finance' | 'Design & Product'>('Operations');
  const [newPosition, setNewPosition] = useState('');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        emp.position.toLowerCase().includes(search.toLowerCase());
      const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, search, departmentFilter]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const initials = newName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newEmp: Employee = {
      id: Date.now().toString(),
      name: newName,
      avatar: initials || 'EM',
      email: newEmail,
      role: 'Employee',
      department: newDepartment,
      position: newPosition || 'Team Member',
      status: 'Active',
      checkIn: '09:00 AM',
    };

    setEmployees([newEmp, ...employees]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPosition('');
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
              {['All', 'Operations', 'Engineering', 'Finance', 'Design & Product'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={departmentFilter === dept ? 'active' : ''}
                  onClick={() => setDepartmentFilter(dept)}
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Cards Grid */}
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
                    {emp.avatar}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{emp.name}</h3>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>{emp.position}</div>
                  </div>
                </div>

                <span
                  className={`badge-chip ${
                    emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'danger'
                  }`}
                >
                  {emp.status}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="muted">
                  <Mail width={14} height={14} /> {emp.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="muted">
                  <Building width={14} height={14} /> Department: <strong style={{ color: 'var(--text)' }}>{emp.department}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                <span className="pill" style={{ fontSize: '0.75rem' }}>
                  Role: {emp.role}
                </span>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  Check-in: <strong>{emp.checkIn}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>

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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Onboard New Employee</h3>
                <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                  <X width={18} height={18} />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Department
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e: any) => setNewDepartment(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <option value="Operations">Operations</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Design & Product">Design & Product</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Job Title / Position
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Specialist"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="ghost-btn" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Save Employee
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
