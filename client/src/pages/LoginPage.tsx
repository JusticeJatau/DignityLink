import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    label: 'Program Coordinator',
    scope: 'All Communities (Bakassi, Konduga, Muna Garage)',
    email: 'coordinator@dignitylink.org',
    pass: 'Dignity2026!',
  },
  {
    label: 'Community Volunteer · Bakassi IDP Camp',
    scope: 'Bakassi IDP Camp only (Jere LGA)',
    email: 'volunteer.bakassi@dignitylink.org',
    pass: 'Dignity2026!',
  },
  {
    label: 'Community Volunteer · Konduga Rural',
    scope: 'Konduga Rural only (Konduga LGA)',
    email: 'volunteer.konduga@dignitylink.org',
    pass: 'Dignity2026!',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('coordinator@dignitylink.org');
  const [password, setPassword] = useState('Dignity2026!');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Context Panel */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-700 flex items-center justify-center font-bold text-sm text-white">
                DL
              </div>
              <span className="text-lg font-semibold tracking-tight">DignityLink</span>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              InnovateHER Hackathon · Women&apos;s Health &amp; Wellness
            </p>
            <h1 className="text-2xl font-bold text-white mt-3 leading-snug">
              Menstrual Hygiene Education by SMS and WhatsApp
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Supporting women and adolescent girls in IDP camps and rural communities with
              reusable hygiene kits and discreet 12-week educational follow-up.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <div>· 28-message 12-week curriculum (English &amp; Hausa)</div>
            <div>· Mandatory informed consent &amp; minor guardian checks</div>
            <div>· Mock SMS &amp; WhatsApp providers with simulated handset</div>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="lg:col-span-7 p-8">
          <h2 className="text-xl font-bold text-slate-900">Volunteer &amp; Coordinator Sign In</h2>
          <p className="text-sm text-slate-600 mt-1">
            Sign in with your role credentials to access community-scoped workflows.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-700 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-800 hover:bg-rose-900 text-white font-medium text-sm transition disabled:opacity-60 cursor-pointer"
            >
              <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2.5">
              Demo Role Accounts (click to fill credentials):
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition cursor-pointer ${
                    email === acc.email
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{acc.label}</div>
                  <div className="text-slate-500 mt-0.5">
                    <span className="font-mono">{acc.email}</span> · {acc.scope}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
