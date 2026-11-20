import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Smartphone, Ban, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';
import { StatusIndicator } from '../components/StatusBadge';

interface Beneficiary {
  _id: string;
  name: string;
  phone: string;
  preferredLanguage: 'en' | 'ha';
  channel: 'sms' | 'whatsapp';
  community: string;
  startDate: string;
  isMinor: boolean;
  status: 'active' | 'opted_out' | 'completed';
  consent?: {
    recordedByName?: string;
    guardianName?: string;
  };
}

const computeProgramWeek = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Starts soon';
  const week = Math.floor(diffDays / 7) + 1;
  return week > 12 ? 'Completed (12w)' : `Week ${week} of 12`;
};

export const BeneficiariesPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [confirmOptOutId, setConfirmOptOutId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const data = await apiRequest<{ beneficiaries: Beneficiary[] }>(
        `/api/beneficiaries?${params.toString()}`
      );
      setBeneficiaries(data.beneficiaries);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadBeneficiaries();
  }, [loadBeneficiaries]);

  const handleOptOut = async (b: Beneficiary) => {
    setNotice('');
    setError('');
    try {
      const res = await apiRequest<{ message: string }>(`/api/beneficiaries/${b._id}/opt-out`, {
        method: 'PATCH',
      });
      setConfirmOptOutId(null);
      setNotice(res.message);
      loadBeneficiaries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered Beneficiaries</h1>
          <p className="text-sm text-slate-600 mt-1">
            Verified consent records, program week progress, channel, and opt-out status.
          </p>
        </div>
        <Link
          to="/register"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-sm font-medium whitespace-nowrap shrink-0"
        >
          New Registration
        </Link>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Search & Segmented Status Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, phone, or community..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'opted_out', label: 'Opted Out' },
            { value: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Beneficiary</th>
              <th className="px-4 py-3">Community</th>
              <th className="px-4 py-3">Channel &amp; Language</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Consent Record</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {beneficiaries.map((b) => (
              <tr key={b._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{b.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{b.phone}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{b.community}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs">
                    <StatusIndicator value={b.channel} />
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-700">
                      {b.preferredLanguage === 'ha' ? 'Hausa' : 'English'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-700 tabular-nums">
                  <div className="font-medium">{computeProgramWeek(b.startDate)}</div>
                  <div className="text-slate-500 font-mono">
                    Start: {new Date(b.startDate).toISOString().slice(0, 10)}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>By {b.consent?.recordedByName}</span>
                  </div>
                  {b.isMinor && (
                    <div className="text-amber-800 mt-0.5">
                      Minor · Guardian: {b.consent?.guardianName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusIndicator value={b.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      to={`/simulator?beneficiaryId=${b._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 whitespace-nowrap"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Phone</span>
                    </Link>

                    {b.status === 'active' &&
                      (confirmOptOutId === b._id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOptOut(b)}
                            className="px-2.5 py-1.5 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium cursor-pointer"
                          >
                            Confirm Stop
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmOptOutId(null)}
                            className="px-2 py-1.5 rounded-md border border-slate-300 text-slate-600 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmOptOutId(b._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium whitespace-nowrap cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Opt Out</span>
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && beneficiaries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No beneficiaries found matching your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
