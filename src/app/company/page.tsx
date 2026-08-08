'use client';

import React, { useState, useEffect } from 'react';
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
  X,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  code: string;
  department_id: string | null;
  departments: { name: string } | null;
  company_id: string | null;
  companies: { name: string } | null;
  status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
}

interface Company {
  id: string;
  name: string;
  trade_license: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
}

interface ExpiryItem {
  empCode: string;
  name: string;
  docType: 'Visa' | 'Emirates ID' | 'Passport' | 'Labour Card' | 'Contract';
  expiryDate: string;
  daysRemaining: number;
  status: 'Critical' | 'Warning' | 'Valid';
}

export default function UAECompanyPage() {
  const [activeTab, setActiveTab] = useState<'expiries' | 'projects' | 'sites' | 'departments' | 'companies'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expiries, setExpiries] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [projectForm, setProjectForm] = useState({
    name: '',
    code: '',
    department_id: '',
    company_id: '',
    start_date: '',
    end_date: '',
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    trade_license: '',
    address: '',
    city: 'Dubai',
    country: 'UAE',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'projects') {
        const res = await fetch('/api/company?type=projects');
        const data = await res.json();
        setProjects(data.projects || []);
      } else if (activeTab === 'companies') {
        const res = await fetch('/api/company?type=companies');
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      showNotification('error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'project', ...projectForm }),
      });
      const data = await res.json();

      if (res.ok) {
        showNotification('success', 'Project created successfully');
        setShowProjectModal(false);
        setProjectForm({ name: '', code: '', department_id: '', company_id: '', start_date: '', end_date: '' });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to create project');
      }
    } catch (error) {
      showNotification('error', 'Failed to create project');
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'company', ...companyForm }),
      });
      const data = await res.json();

      if (res.ok) {
        showNotification('success', 'Company created successfully');
        setShowCompanyModal(false);
        setCompanyForm({ name: '', trade_license: '', address: '', city: 'Dubai', country: 'UAE', phone: '', email: '' });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to create company');
      }
    } catch (error) {
      showNotification('error', 'Failed to create company');
    }
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
            className={activeTab === 'companies' ? 'primary-btn' : 'btn-secondary'}
            onClick={() => setActiveTab('companies')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Building2 width={16} height={16} /> Companies
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
                  {expiries.map((item: ExpiryItem, idx: number) => (
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
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Company Projects & Sites</h3>
              <button className="primary-btn" onClick={() => setShowProjectModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus width={16} height={16} /> Add Project
              </button>
            </div>
            {loading ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
            ) : projects.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>No projects found</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map((project) => (
                  <div key={project.id} className="card" style={{ padding: '20px', border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{project.name}</h4>
                    <p className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      {project.departments?.name || 'No Department'} | Code: {project.code}
                    </p>
                    <div style={{ marginTop: '16px', fontSize: '0.88rem' }}>
                      Progress: <strong>{project.progress}%</strong>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className={`badge-chip ${project.status === 'Active' ? 'success' : 'warning'}`}>{project.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'companies' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Registered Companies</h3>
              <button className="primary-btn" onClick={() => setShowCompanyModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus width={16} height={16} /> Add Company
              </button>
            </div>
            {loading ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
            ) : companies.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>No companies found</div>
            ) : (
              <div className="card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Trade License</th>
                      <th>City</th>
                      <th>Country</th>
                      <th>Phone</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td><strong>{company.name}</strong></td>
                        <td>{company.trade_license || 'N/A'}</td>
                        <td>{company.city || 'N/A'}</td>
                        <td>{company.country || 'N/A'}</td>
                        <td>{company.phone || 'N/A'}</td>
                        <td>{company.email || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

        {/* Notification */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '8px',
            background: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
            color: '#fff',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {notification.message}
          </div>
        )}

        {/* Add Project Modal */}
        {showProjectModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add New Project</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowProjectModal(false)}>
                  <X width={20} height={20} />
                </button>
              </div>
              <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Burj Vista Tower Maintenance"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Project Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PRJ-001"
                    value={projectForm.code}
                    onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="ghost-btn" onClick={() => setShowProjectModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Add Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Company Modal */}
        {showCompanyModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add New Company</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowCompanyModal(false)}>
                  <X width={20} height={20} />
                </button>
              </div>
              <form onSubmit={handleAddCompany} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Mansoor Construction LLC"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Trade License
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TL-987654"
                    value={companyForm.trade_license}
                    onChange={(e) => setCompanyForm({ ...companyForm, trade_license: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dubai Silicon Oasis"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={companyForm.city}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Country
                    </label>
                    <input
                      type="text"
                      value={companyForm.country}
                      onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+971-4-1234567"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="info@company.ae"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="ghost-btn" onClick={() => setShowCompanyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Add Company
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
