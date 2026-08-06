'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Clock3 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        // Check if profile exists, create if not
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || email.split('@')[0],
              role: 'admin',
              employment_status: 'Active',
            });
        }

        router.push('/');
        router.refresh();
      }
    } catch {
      setErrorMsg('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-visual">
        <div className="auth-badge">
          <Sparkles size={16} />
          SaaS-ready workforce OS
        </div>
        <h1>Attendance Master</h1>
        <p>Run attendance, payroll, and approvals from one elegant command center designed for modern teams.</p>

        <ul className="auth-list">
          <li>
            <CheckCircle2 size={18} />
            Real-time attendance visibility
          </li>
          <li>
            <ShieldCheck size={18} />
            Secure access for every team member
          </li>
          <li>
            <Clock3 size={18} />
            Faster approvals and smoother payroll flow
          </li>
        </ul>

        <div className="auth-visual-card">
          <div className="auth-visual-card-top">
            <span>Today’s pulse</span>
            <span className="pill">94.6% on time</span>
          </div>
          <div className="auth-visual-stat">
            <strong>1,126</strong>
            <span>Present today</span>
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
              <h2>Welcome back</h2>
              <p className="muted">Sign in to your HR command center</p>
            </div>
          </div>

          {errorMsg && <div className="form-error auth-alert">{errorMsg}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="auth-input">
                <Mail size={16} />
                <input
                  type="email"
                  placeholder="you@company.com"
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
                />
              </div>
            </div>

            <div className="auth-row">
              <label className="checkbox-group">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <a href="https://central.crestinfosystems.net/forgetpassword" className="auth-link" target="_blank" rel="noreferrer">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-footer">
            <span className="muted">Don&apos;t have an account?</span>
            <Link href="/register" className="auth-link">
              Create one
            </Link>
          </div>

          <div className="auth-demo">Demo credentials: admin@attendance.io / demo1234</div>
        </div>
      </div>
    </div>
  );
}
