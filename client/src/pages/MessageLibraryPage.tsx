import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Edit3, Save, X, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface TemplateItem {
  _id: string;
  week: number;
  slot: number;
  sequenceNumber: number;
  dayLabel: string;
  language: 'en' | 'ha';
  theme: string;
  body: string;
  reviewStatus: 'prototype_draft' | 'professionally_reviewed';
  isActive: boolean;
}

export const MessageLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [language, setLanguage] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editReviewStatus, setEditReviewStatus] = useState<
    'prototype_draft' | 'professionally_reviewed'
  >('prototype_draft');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (language !== 'all') params.set('language', language);
      if (weekFilter !== 'all') params.set('week', weekFilter);
      const data = await apiRequest<{ templates: TemplateItem[] }>(
        `/api/messages/library?${params.toString()}`
      );
      setTemplates(data.templates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [language, weekFilter]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleSave = async (id: string) => {
    setError('');
    if (editBody.trim().length > 160) {
      setError('SMS messages must remain under 160 characters.');
      return;
    }
    try {
      await apiRequest(`/api/messages/library/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ body: editBody, reviewStatus: editReviewStatus }),
      });
      setEditingId(null);
      loadLibrary();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            12-Week Message Library (28 Messages)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Weeks 1–4: Mon/Wed/Fri (12 messages) · Weeks 5–12: Tue/Fri (16 messages) · Strictly
            under 160 characters per SMS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {[
              { value: 'all', label: 'EN & HA' },
              { value: 'en', label: 'English' },
              { value: 'ha', label: 'Hausa' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setLanguage(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap cursor-pointer ${
                  language === tab.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by week"
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All 12 Weeks</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-sm text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Prototype Content Safety Notice:</strong> These messages provide general menstrual
          hygiene guidance and discreet wording (no beneficiary names or sensitive health terms).
          Before real field deployment, a qualified health professional must review all health
          content and native speakers must verify Hausa translations.
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-600">Loading 28-message curriculum...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <article
              key={t._id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span className="font-mono">
                      #{t.sequenceNumber} · W{t.week} ({t.dayLabel})
                    </span>
                    <span className="text-slate-400">·</span>
                    <span>{t.language === 'ha' ? 'Hausa' : 'English'}</span>
                  </div>
                  <span>{t.theme}</span>
                </div>

                {editingId === t._id ? (
                  <div className="space-y-3 mt-3">
                    <textarea
                      rows={3}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <select
                        value={editReviewStatus}
                        onChange={(e) =>
                          setEditReviewStatus(
                            e.target.value as 'prototype_draft' | 'professionally_reviewed'
                          )
                        }
                        className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="prototype_draft">Prototype Draft</option>
                        <option value="professionally_reviewed">Professionally Reviewed</option>
                      </select>

                      <span
                        className={`font-mono ${
                          editBody.length > 160 ? 'text-rose-700 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {editBody.length} / 160 chars
                      </span>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(t._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-rose-800 text-white text-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-800 leading-relaxed mt-3">{t.body}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums">{t.body.length} / 160 chars</span>
                  <span>·</span>
                  {t.reviewStatus === 'professionally_reviewed' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                    </span>
                  ) : (
                    <span>Prototype draft</span>
                  )}
                </div>

                {user?.role === 'coordinator' && editingId !== t._id && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(t._id);
                      setEditBody(t.body);
                      setEditReviewStatus(t.reviewStatus);
                    }}
                    className="inline-flex items-center gap-1 text-rose-800 hover:underline font-medium cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
