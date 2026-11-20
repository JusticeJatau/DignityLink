import mongoose from 'mongoose';

const messageLogSchema = new mongoose.Schema(
  {
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true,
      index: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageTemplate',
      default: null,
    },
    week: {
      type: Number,
      default: null,
    },
    slot: {
      type: Number,
      default: null,
    },
    language: {
      type: String,
      enum: ['en', 'ha'],
      default: 'en',
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    recipientPhone: {
      type: String,
      required: true,
    },
    messageBody: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ['outbound', 'inbound'],
      default: 'outbound',
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed', 'received'],
      required: true,
    },
    externalMessageId: {
      type: String,
      default: '',
    },
    providerRequest: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    scheduledForDate: {
      type: String,
      default: '',
    },
    triggerType: {
      type: String,
      enum: ['cron', 'manual_demo', 'inbound_reply', 'system_notice'],
      default: 'cron',
    },
  },
  { timestamps: true }
);

// Prevent sending the same scheduled week+slot message twice to the same beneficiary
messageLogSchema.index(
  { beneficiary: 1, week: 1, slot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      direction: 'outbound',
      week: { $type: 'number' },
      slot: { $type: 'number' },
      status: { $in: ['sent', 'delivered'] },
    },
  }
);

export default mongoose.model('MessageLog', messageLogSchema);
