import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Smartphone,
  HelpCircle,
  ThumbsUp,
  Ban,
} from 'lucide-react';

interface StatusIndicatorProps {
  value: string;
  customLabel?: string;
}

const CONFIG: Record<string, { label: string; colorClass: string; Icon: React.ElementType }> = {
  active: { label: 'Active', colorClass: 'text-emerald-700', Icon: CheckCircle2 },
  opted_out: { label: 'Opted Out', colorClass: 'text-rose-700', Icon: Ban },
  completed: { label: 'Completed (12w)', colorClass: 'text-indigo-700', Icon: CheckCircle2 },
  delivered: { label: 'Delivered (Mock)', colorClass: 'text-emerald-700', Icon: CheckCircle2 },
  sent: { label: 'Sent', colorClass: 'text-sky-700', Icon: CheckCircle2 },
  queued: { label: 'Queued', colorClass: 'text-slate-600', Icon: Clock },
  received: { label: 'Inbound Reply', colorClass: 'text-amber-700', Icon: MessageSquare },
  failed: { label: 'Failed', colorClass: 'text-rose-700', Icon: XCircle },
  sms: { label: 'SMS', colorClass: 'text-slate-700', Icon: Smartphone },
  whatsapp: { label: 'WhatsApp', colorClass: 'text-emerald-700', Icon: MessageSquare },
  helpful: { label: '1 · Helpful', colorClass: 'text-emerald-700', Icon: ThumbsUp },
  question: { label: '2 · Question', colorClass: 'text-amber-700', Icon: HelpCircle },
  opt_out: { label: 'STOP · Opt-out', colorClass: 'text-rose-700', Icon: Ban },
  other: { label: 'Other Reply', colorClass: 'text-slate-600', Icon: MessageSquare },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ value, customLabel }) => {
  const item = CONFIG[value] || {
    label: value,
    colorClass: 'text-slate-700',
    Icon: Clock,
  };
  const { Icon } = item;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${item.colorClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{customLabel || item.label}</span>
    </span>
  );
};
