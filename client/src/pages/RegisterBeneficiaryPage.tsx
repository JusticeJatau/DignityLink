import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const COMMUNITIES = ['Bakassi IDP Camp', 'Konduga Rural', 'Muna Garage Camp'];

export const RegisterBeneficiaryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultCommunity =
    user?.role === 'volunteer' && user?.community !== 'All'
      ? user.community
      : COMMUNITIES[0];

  const [form, setForm] = useState({
    name: '',
    phone: '',
    preferredLanguage: 'en',
    channel: 'sms',
    community: defaultCommunity,
    startDate: new Date().toISOString().slice(0, 10),
    kitDistributed: true,
    isMinor: false,
    consentGiven: false,
    guardianConsentGiven: false,
    guardianName: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.consentGiven) {
      setError('Registration cannot be completed without informed consent.');
      return;
    }

    if (form.isMinor && (!form.guardianConsentGiven || !form.guardianName.trim())) {
      setError('Parent or guardian consent and name are required for girls under 18.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest<{ beneficiary: { name: string } }>('/api/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess(
        `${data.beneficiary.name} registered successfully. Consent recorded by ${user?.name}.`
      );
      setTimeout(() => navigate('/beneficiaries'), 1100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Beneficiary Registration &amp; Consent Capture
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Data minimization enforced: only name, phone number, language, community, start date,
          and consent records are stored. No health records are collected.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        {/* Step 1: Kit Distribution */}
        <div className="pb-5 border-b border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.kitDistributed}
              onChange={(e) => setForm({ ...form, kitDistributed: e.target.checked })}
              className="mt-1 h-4 w-4 accent-rose-800"
            />
            <div className="text-sm">
              <div className="font-semibold text-slate-900">
                01. Reusable Hygiene Kit Distributed
              </div>
              <p className="text-slate-600 mt-0.5">
                Confirm the beneficiary received the reusable kit (2–3 washable pads, mild soap,
                and waterproof storage pouch) along with the in-person demonstration.
              </p>
            </div>
          </label>
        </div>

        {/* Step 2: Minimal Beneficiary Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            02. Beneficiary Details (Minimal Data Only)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Beneficiary Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Sadiya Mohammed"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g., 08031234567 or +2348031234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Preferred Language *
              </label>
              <select
                value={form.preferredLanguage}
                onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="en">English</option>
                <option value="ha">Hausa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Delivery Channel *
              </label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="sms">SMS (Works on Basic Phones)</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Community *</label>
              {user?.role === 'volunteer' && user?.community !== 'All' ? (
                <input
                  type="text"
                  readOnly
                  value={form.community}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm text-slate-700"
                />
              ) : (
                <input
                  type="text"
                  list="community-options"
                  required
                  value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              )}
              <datalist id="community-options">
                {COMMUNITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Informed Consent & Minor Guardian Consent */}
        <div className="border-t border-slate-200 pt-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-rose-800" />
            <span>03. Plain-Language Informed Consent (Mandatory)</span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pl-1">
            <p className="font-semibold text-slate-800">Volunteer Explanation Checklist:</p>
            <p>· Explain she will receive short hygiene tips for 12 weeks (3x/week in Weeks 1–4, 2x/week in Weeks 5–12).</p>
            <p>· Messages avoid personal details to protect privacy if someone else sees the phone.</p>
            <p>· She can stop messages anytime by replying STOP.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.consentGiven}
              onChange={(e) => setForm({ ...form, consentGiven: e.target.checked })}
              className="mt-1 h-4 w-4 accent-rose-800"
            />
            <span className="text-sm text-slate-800">
              <strong>Informed consent recorded:</strong> Service explained in plain language and
              beneficiary agreed to receive messages. Recorded by <strong>{user?.name}</strong>.
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isMinor}
              onChange={(e) => setForm({ ...form, isMinor: e.target.checked })}
              className="h-4 w-4 accent-rose-800"
            />
            <span className="text-sm font-medium text-slate-800">
              Beneficiary is under 18 years old (Requires parent or guardian consent)
            </span>
          </label>

          {form.isMinor && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
              <div className="text-xs font-semibold text-amber-900">
                Parent / Guardian Consent Required (Under 18)
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Parent or Guardian Full Name *
                </label>
                <input
                  type="text"
                  required={form.isMinor}
                  placeholder="e.g., Amina Yusuf (Mother)"
                  value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.guardianConsentGiven}
                  onChange={(e) => setForm({ ...form, guardianConsentGiven: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-rose-800"
                />
                <span className="text-sm text-slate-800">
                  Parent/guardian gave informed consent for this minor to receive DignityLink
                  hygiene messages.
                </span>
              </label>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/beneficiaries')}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-sm font-medium disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Complete Consented Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};
