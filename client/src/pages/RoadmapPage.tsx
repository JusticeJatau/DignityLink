import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

const PROTOTYPE_FEATURES = [
  'Volunteer and coordinator login (JWT) with role-scoped access control',
  'Beneficiary registration with mandatory informed consent and minor guardian consent',
  '28-message, 12-week curriculum library by week and language (English & Hausa, <160 chars)',
  'Daily scheduler using node-cron (W1–4 Mon/Wed/Fri, W5–12 Tue/Fri) and Run Scheduler Now demo control',
  'Shared MessagingProvider layer with Mock SMS and Mock WhatsApp providers logging every request',
  'Simulated phone-style screen showing SMS/WhatsApp messages arriving',
  'Feedback capture (reply 1 = helpful, 2 = question) and STOP opt-out handling',
  'Volunteer dashboard with registrations, messages sent, and feedback by community',
];

const PLANNED_LATER = [
  "Real SMS and WhatsApp delivery through a messaging provider (Africa's Talking, Twilio, WhatsApp Cloud API)",
  'WhatsApp bot self-registration ("JOIN" keyword)',
  'Full Hausa and other local language support, with voice messages for low-literacy users',
  'Two-way Q&A between beneficiaries and health workers',
  'Clinic referral links when warning signs are reported',
  'Offline-friendly volunteer app that syncs when connectivity returns',
  'Impact tracking of reported practices and feedback trends over time',
  'Kit and local production tracking for pad-making groups',
  'Professional medical review workflow for health content and native speaker translation checks',
];

export const RoadmapPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Prototype Scope &amp; Planned Future Roadmap
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Transparent separation between features implemented in this hackathon prototype and items
          planned for real-world deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Included in Hackathon Prototype (Implemented)</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {PROTOTYPE_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
            <Clock className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Planned for Later (Post-Hackathon Deployment)</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {PLANNED_LATER.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-700 space-y-2">
        <h2 className="font-semibold text-slate-900 text-base">
          Target Beneficiaries, Sustainability &amp; Limitations
        </h2>
        <p>
          <strong>Target reach:</strong> Women and girls in IDP camps and rural communities (aiming
          to reach 2,500 beneficiaries across 3 LGAs with reusable kits, local pad production, and
          SMS/WhatsApp education).
        </p>
        <p>
          <strong>Prototype limitations:</strong> Message delivery uses mock SMS and WhatsApp
          providers because real providers require paid accounts. Health guidance requires qualified
          health professional review and native speaker verification, plus formal data protection
          compliance before live deployment.
        </p>
      </div>
    </div>
  );
};
