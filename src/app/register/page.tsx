'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, User, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Clock3 } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setErrorMsg('An error occurred during account registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-visual">
        <div className="auth-badge">
          <Sparkles size={16} />
          Elevate your workforce ops
        </div>
        <h1>Start faster with Attendance Master</h1>
        <p>Launch attendance, leave, and payroll workflows with a premium experience your team will actually enjoy.</p>

        <ul className="auth-list">
          <li>
            <CheckCircle2 size={18} />
            Centralized attendance and staffing data
          </li>
          <li>
            <ShieldCheck size={18} />
            Role-based access and secure onboarding
          </li>
          <li>
            <Clock3 size={18} />
            Automated reminders for approvals and payroll
          </li>
        </ul>

        <div className="auth-visual-card">
          <div className="auth-visual-card-top">
            <span>Launch in minutes</span>
            <span className="pill">No heavy setup</span>
          </div>
          <div className="auth-visual-stat">
            <strong>24/7</strong>
            <span>Operational visibility</span>
          </div>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="card auth-card">
          <div className="auth-brand">
            <div className="auth-logo">
              <span>AM</span>
            </div>
            <div>
              <h2>Create your account</h2>
              <p className="muted">Start managing workforce operations with a polished, modern experience</p>
            </div>
          </div>

          {errorMsg && <div className="form-error auth-alert">{errorMsg}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full name</label>
              <div className="auth-input">
                <User size={16} />
                <input
                  type="text"
                  placeholder="Alicia Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Work email</label>
              <div className="auth-input">
                <Mail size={16} />
                <input
                  type="text"
                  placeholder="alicia@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="auth-input">
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Get started free'} <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-footer">
            <span className="muted">Already registered?</span>
            <Link href="/login" className="auth-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
