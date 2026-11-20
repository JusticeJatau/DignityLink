import React, { useEffect, useState } from 'react';
import { Server, Layers } from 'lucide-react';
import { apiRequest } from '../api/client';
import { StatusIndicator } from '../components/StatusBadge';

interface MessageLogItem {
  _id: string;
  createdAt: string;
  recipientPhone: string;
  channel: string;
  provider: string;
  direction: string;
  status: string;
  messageBody: string;
  externalMessageId?: string;
  beneficiary?: {
    name: string;
  };
}

interface SchedulerRunItem {
  _id: string;
  summaryNotes: string;
  triggerType: string;
  durationMs: number;
  createdAt: string;
  triggeredBy?: {
    name: string;
  };
}

interface ProviderStatus {
  smsProvider: string;
  whatsappProvider: string;
}

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<MessageLogItem[]>([]);
  const [runs, setRuns] = useState<SchedulerRunItem[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [channelFilter, setChannelFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      setError('');
      try {
        const qs = channelFilter !== 'all' ? `?channel=${channelFilter}` : '';
        const [logsRes, runsRes, provRes] = await Promise.all([
          apiRequest<{ logs: MessageLogItem[] }>(`/api/messages/logs${qs}`),
          apiRequest<{ runs: SchedulerRunItem[] }>('/api/scheduler/runs'),
          apiRequest<ProviderStatus>('/api/messages/providers/status'),
        ]);
        setLogs(logsRes.logs);
        setRuns(runsRes.runs);
        setProviderStatus(provRes);
      } catch (err: any) {
        setError(err.message);
      }
    };
    loadAll();
  }, [channelFilter]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Mock Provider Logs &amp; Scheduler History
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Every simulated SMS and WhatsApp request passes through the shared MessagingProvider
          interface and is recorded in MongoDB.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Provider Layer Config */}
      {providerStatus && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Layers className="w-4 h-4 text-rose-800" />
            <span>Active Messaging Provider Layer (Swappable via Environment Config)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <div className="text-slate-500">SMS Provider Active</div>
              <div className="font-mono font-semibold text-slate-900 mt-1">
                {providerStatus.smsProvider}
              </div>
            </div>
            <div>
              <div className="text-slate-500">WhatsApp Provider Active</div>
              <div className="font-mono font-semibold text-slate-900 mt-1">
                {providerStatus.whatsappProvider}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Production Swap Targets</div>
              <div className="text-slate-800 mt-1">
                Africa&apos;s Talking · Twilio · WhatsApp Cloud API (config + keys only)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Messaging Activity Logs</h2>
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {[
              { value: 'all', label: 'All Channels' },
              { value: 'sms', label: 'SMS' },
              { value: 'whatsapp', label: 'WhatsApp' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setChannelFilter(tab.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition whitespace-nowrap cursor-pointer ${
                  channelFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Channel &amp; Provider</th>
                <th className="px-4 py-3">Direction &amp; Status</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">External ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {log.beneficiary?.name || 'Beneficiary'}
                    </div>
                    <div className="text-slate-500 font-mono">{log.recipientPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusIndicator value={log.channel} />
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-600">{log.provider}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 capitalize">
                        {log.direction}
                      </span>
                      <span className="text-slate-400">·</span>
                      <StatusIndicator value={log.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-700" title={log.messageBody}>
                    {log.messageBody}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                    {log.externalMessageId || '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No messaging logs recorded for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduler Runs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-600" />
          <h2 className="text-base font-semibold text-slate-900">Recent Scheduler Runs</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {runs.map((run) => (
            <div
              key={run._id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-mono font-medium text-slate-900">{run.summaryNotes}</div>
                <div className="text-slate-500 mt-1">
                  Trigger: {run.triggerType}
                  {run.triggeredBy ? ` by ${run.triggeredBy.name}` : ''} · Duration:{' '}
                  <span className="font-mono">{run.durationMs}ms</span>
                </div>
              </div>
              <div className="text-slate-500 font-mono whitespace-nowrap">
                {new Date(run.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
