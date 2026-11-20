import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Send,
  ThumbsUp,
  HelpCircle,
  CheckCircle,
  UserPlus,
  Smartphone,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SchedulerPanel } from '../components/SchedulerPanel';
import { StatusIndicator } from '../components/StatusBadge';

interface CommunityBreakdown {
  community: string;
  registrations: number;
  active: number;
  optedOut: number;
  messagesSent: number;
  helpfulCount: number;
  questionCount: number;
}

interface FeedbackItem {
  _id: string;
  community: string;
  channel: string;
  rawReply: string;
  category: string;
  resolved: boolean;
  notes?: string;
  createdAt: string;
  beneficiary?: {
    name: string;
    phone: string;
  };
}

interface DashboardStatsResponse {
  scopeCommunity: string;
  availableCommunities: string[];
  totals: {
    registrations: number;
    active: number;
    optedOut: number;
    completed: number;
    minorsWithGuardianConsent: number;
    messagesSent: number;
    smsMessagesSent: number;
    whatsappMessagesSent: number;
    helpfulFeedback: number;
    questionFeedback: number;
    unresolvedQuestions: number;
  };
  byCommunity: CommunityBreakdown[];
  recentFeedback: FeedbackItem[];
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [communityFilter, setCommunityFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs =
        user?.role === 'coordinator' && communityFilter !== 'All'
          ? `?community=${encodeURIComponent(communityFilter)}`
          : '';
      const data = await apiRequest<DashboardStatsResponse>(`/api/dashboard/stats${qs}`);
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role, communityFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleResolveFeedback = async (id: string) => {
    setActionMessage('');
    try {
      await apiRequest(`/api/dashboard/feedback/${id}/resolve`, { method: 'PATCH' });
      setActionMessage('Follow-up recorded in database.');
      loadStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totals = stats?.totals;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.role === 'coordinator' ? 'Program Coordinator Dashboard' : 'Volunteer Dashboard'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Scope: <span className="font-medium text-slate-900">{stats?.scopeCommunity || 'All'}</span>
            <span className="mx-2 text-slate-400">·</span>
            <span>Mock SMS &amp; WhatsApp Delivery Active</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {user?.role === 'coordinator' && (stats?.availableCommunities?.length || 0) > 0 && (
            <select
              aria-label="Filter dashboard by community"
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="All">All Communities</option>
              {stats?.availableCommunities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-sm font-medium whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Beneficiary</span>
          </Link>
          <Link
            to="/simulator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>Simulated Phone</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {actionMessage}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Registrations</span>
            <Users className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {totals?.registrations ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            {totals?.active ?? 0} active · {totals?.optedOut ?? 0} opted out ·{' '}
            {totals?.minorsWithGuardianConsent ?? 0} minors
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Messages Sent</span>
            <Send className="w-4 h-4 text-sky-700" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {totals?.messagesSent ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            SMS: {totals?.smsMessagesSent ?? 0} · WhatsApp: {totals?.whatsappMessagesSent ?? 0}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Helpful Replies (1)</span>
            <ThumbsUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {totals?.helpfulFeedback ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Beneficiaries who replied 1</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Questions (2)</span>
            <HelpCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {totals?.questionFeedback ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            {totals?.unresolvedQuestions ?? 0} awaiting volunteer follow-up
          </p>
        </div>
      </div>

      {/* Scheduler Control */}
      <SchedulerPanel onRunComplete={loadStats} />

      {/* Community Breakdown & Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Breakdown by Community
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Community</th>
                  <th className="px-4 py-3 text-right">Registered</th>
                  <th className="px-4 py-3 text-right">Sent</th>
                  <th className="px-4 py-3 text-right">Helpful (1)</th>
                  <th className="px-4 py-3 text-right">Questions (2)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {(stats?.byCommunity || []).map((row) => (
                  <tr key={row.community} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.community}</td>
                    <td className="px-4 py-3 text-right">
                      {row.registrations}{' '}
                      <span className="text-xs text-slate-500">({row.active} active)</span>
                    </td>
                    <td className="px-4 py-3 text-right">{row.messagesSent}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                      {row.helpfulCount}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700 font-medium">
                      {row.questionCount}
                    </td>
                  </tr>
                ))}
                {(stats?.byCommunity || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No community data recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Beneficiary Replies &amp; Opt-Outs
            </h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {(stats?.recentFeedback || []).map((fb) => (
              <div key={fb._id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium text-sm text-slate-900">
                      {fb.beneficiary?.name || 'Beneficiary'}
                    </span>
                    <StatusIndicator value={fb.category} />
                    <StatusIndicator value={fb.channel} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {fb.community} · Reply: &ldquo;{fb.rawReply}&rdquo; ·{' '}
                    <span className="font-mono">
                      {new Date(fb.createdAt).toLocaleString()}
                    </span>
                  </p>
                </div>

                {fb.category === 'question' && (
                  <div className="shrink-0">
                    {fb.resolved ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium whitespace-nowrap">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Followed up
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResolveFeedback(fb._id)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium whitespace-nowrap cursor-pointer"
                      >
                        Mark Followed Up
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {(stats?.recentFeedback || []).length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No feedback replies yet. Use the Simulated Phone screen to reply 1, 2, or STOP.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
