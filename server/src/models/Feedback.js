import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true,
      index: true,
    },
    community: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true,
    },
    rawReply: {
      type: String,
      required: true,
      trim: true,
    },
    replyCode: {
      type: String,
      enum: ['1', '2', 'STOP', 'OTHER'],
      required: true,
    },
    category: {
      type: String,
      enum: ['helpful', 'question', 'opt_out', 'other'],
      required: true,
    },
    relatedMessageLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageLog',
      default: null,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);
