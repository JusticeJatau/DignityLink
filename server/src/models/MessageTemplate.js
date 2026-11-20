import mongoose from 'mongoose';

export const MESSAGE_THEMES = [
  'Reusable Pad Care',
  'Personal Hygiene',
  'Health & Warning Signs',
  'Myths & Dignity',
  'Understanding Your Body',
  'Feedback Prompt',
];

const messageTemplateSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    slot: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    sequenceNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 28,
    },
    dayLabel: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
      required: true,
    },
    language: {
      type: String,
      enum: ['en', 'ha'],
      required: true,
    },
    theme: {
      type: String,
      enum: MESSAGE_THEMES,
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: [160, 'SMS messages must remain under 160 characters'],
    },
    reviewStatus: {
      type: String,
      enum: ['prototype_draft', 'professionally_reviewed'],
      default: 'prototype_draft',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

messageTemplateSchema.index({ week: 1, slot: 1, language: 1 }, { unique: true });

export default mongoose.model('MessageTemplate', messageTemplateSchema);
