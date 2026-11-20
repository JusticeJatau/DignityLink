import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Signal, Battery, CheckCheck, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';
import { StatusIndicator } from '../components/StatusBadge';

interface BeneficiaryOption {
  _id: string;
  name: string;
  phone: string;
  channel: 'sms' | 'whatsapp';
  preferredLanguage: 'en' | 'ha';
  community: string;
  status: string;
}

interface ThreadMessage {
  _id: string;
  direction: 'outbound' | 'inbound';
  channel: 'sms' | 'whatsapp';
  provider: string;
  status: string;
  week?: number;
  slot?: number;
  messageBody: string;
  externalMessageId?: string;
  latencyMs?: number;
  providerRequest?: unknown;
  providerResponse?: unknown;
  createdAt: string;
}

export const PhoneSimulatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('beneficiaryId') || '';

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryOption[]>([]);
  const [selectedId, setSelectedId] = useState(initialId);
  const [thread, setThread] = useState<{
    beneficiary: BeneficiaryOption | null;
    messages: ThreadMessage[];
  }>({ beneficiary: null, messages: [] });
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ThreadMessage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadList = async () => {
      try {
        const data = await apiRequest<{ beneficiaries: BeneficiaryOption[] }>('/api/beneficiaries');
        setBeneficiaries(data.beneficiaries);
        if (!selectedId && data.beneficiaries.length > 0) {
          setSelectedId(data.beneficiaries[0]._id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    loadList();
  }, [selectedId]);

  const loadThread = useCallback(async () => {
    if (!selectedId) return;
    setError('');
    try {
      const data = await apiRequest<{
        beneficiary: BeneficiaryOption;
        messages: ThreadMessage[];
      }>(`/api/messages/thread/${selectedId}`);
      setThread({ beneficiary: data.beneficiary, messages: data.messages });
      const lastWithPayload = [...data.messages].reverse().find((m) => m.providerRequest);
      setSelectedLog(lastWithPayload || null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [selectedId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const sendReply = async (textToSend?: string) => {
    const body = (textToSend ?? replyText).trim();
    if (!body || !selectedId) return;
    setSending(true);
    setError('');
    try {
      await apiRequest('/api/messages/inbound', {
        method: 'POST',
        body: JSON.stringify({ beneficiaryId: selectedId, text: body }),
      });
      setReplyText('');
      await loadThread();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const b = thread.beneficiary;
  const isWhatsApp = b?.channel === 'whatsapp';

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Simulated Phone Screen &amp; Inbound Feedback Tester
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Watch scheduled SMS or WhatsApp messages arrive on a beneficiary handset and test replying{' '}
          <strong className="font-mono">1</strong> (Helpful),{' '}
          <strong className="font-mono">2</strong> (Question), or{' '}
          <strong className="font-mono">STOP</strong> (Opt-out).
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Beneficiary Handset
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {beneficiaries.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.channel.toUpperCase()} · {item.preferredLanguage.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {b && (
            <div className="py-3 border-y border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-slate-900">{b.phone}</span>
                <StatusIndicator value={b.status} />
              </div>
              <div className="text-slate-600">Community: {b.community}</div>
              <div className="text-slate-600">
                Channel: <strong>{b.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</strong> · Language:{' '}
                <strong>{b.preferredLanguage === 'ha' ? 'Hausa' : 'English'}</strong>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Quick Simulated Beneficiary Replies
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => sendReply('1')}
                className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-medium text-left cursor-pointer"
              >
                Reply &ldquo;1&rdquo; — This was helpful
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => sendReply('2')}
                className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-medium text-left cursor-pointer"
              >
                Reply &ldquo;2&rdquo; — I have a question
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => sendReply('STOP')}
                className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-medium text-left cursor-pointer"
              >
                Reply &ldquo;STOP&rdquo; — Opt out of messages
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={loadThread}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Handset Inbox</span>
          </button>
        </div>

        {/* Center Simulated Handset */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-full max-w-[340px] rounded-[2.2rem] bg-slate-900 p-3 shadow-xl border-4 border-slate-800">
            <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-slate-300 font-mono">
              <span>09:41</span>
              <div className="w-16 h-3 rounded-full bg-slate-800" />
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            <div
              className={`px-4 py-3 rounded-t-2xl ${
                isWhatsApp ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-white'
              }`}
            >
              <div className="text-sm font-semibold">
                {isWhatsApp ? 'DignityLink · WhatsApp' : 'DignityLink · SMS Inbox'}
              </div>
              <div className="text-[11px] opacity-85 font-mono">
                {b ? `${b.phone} · Simulated` : 'Select a beneficiary'}
              </div>
            </div>

            <div
              className={`h-[390px] overflow-y-auto p-3 space-y-2.5 ${
                isWhatsApp ? 'bg-[#efeae2]' : 'bg-slate-100'
              }`}
            >
              {thread.messages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';
                const isSelected = selectedLog?._id === msg._id;
                return (
                  <div
                    key={msg._id}
                    onClick={() => setSelectedLog(msg)}
                    className={`cursor-pointer flex flex-col ${
                      isOutbound ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs transition ${
                        isSelected ? 'ring-2 ring-rose-700' : ''
                      } ${
                        isOutbound
                          ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                          : isWhatsApp
                          ? 'bg-emerald-100 text-slate-900 rounded-tr-sm'
                          : 'bg-sky-700 text-white rounded-tr-sm'
                      }`}
                    >
                      {msg.week && (
                        <div className="text-[10px] font-semibold text-rose-800 mb-0.5 font-mono">
                          Week {msg.week} · Slot {msg.slot}
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.messageBody}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono ${
                          isOutbound || isWhatsApp ? 'text-slate-400' : 'text-sky-100'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOutbound && <CheckCheck className="w-3 h-3 text-sky-600" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {thread.messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 px-4">
                  No messages arrived yet. Run the scheduler on the Dashboard for a scheduled day.
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendReply();
              }}
              className="bg-white p-2 rounded-b-2xl border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type 1, 2, or STOP..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-full focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                aria-label="Send simulated reply"
                className="p-2 rounded-full bg-rose-800 text-white disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Provider Payload Inspector */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Mock Provider Request &amp; Response Log
          </h2>
          <p className="text-xs text-slate-600">
            Click any message bubble on the simulated phone to inspect the backend provider
            request and response stored in MongoDB.
          </p>

          {selectedLog ? (
            <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <StatusIndicator value={selectedLog.channel} />
                <StatusIndicator value={selectedLog.status} />
                <span className="font-mono text-slate-600">{selectedLog.provider}</span>
              </div>
              {selectedLog.externalMessageId && (
                <div className="font-mono text-[11px] text-slate-600">
                  ID: {selectedLog.externalMessageId} · {selectedLog.latencyMs}ms
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-700 mb-1">Provider Request:</div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLog.providerRequest, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-semibold text-slate-700 mb-1">Provider Response:</div>
                <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLog.providerResponse, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">
              Select a message bubble to inspect its provider log.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
