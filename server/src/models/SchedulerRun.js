import mongoose from 'mongoose';

const schedulerRunSchema = new mongoose.Schema(
  {
    runDate: {
      type: String,
      required: true,
    },
    triggerType: {
      type: String,
      enum: ['cron', 'manual_demo'],
      required: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    evaluatedBeneficiaries: {
      type: Number,
      default: 0,
    },
    dueCount: {
      type: Number,
      default: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    skippedAlreadySent: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    summaryNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SchedulerRun', schedulerRunSchema);
