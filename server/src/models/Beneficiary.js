import mongoose from 'mongoose';
import { isValidPhone, normalizePhone } from '../utils/phone.js';

// Data minimization: only collect name, phone number, language, community,
// channel, start date, minor flag, and consent details. No health records are stored.
const beneficiarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Beneficiary name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      set: normalizePhone,
      validate: {
        validator: isValidPhone,
        message: 'Please provide a valid phone number (10-15 digits)',
      },
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ha'],
      default: 'en',
      required: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      default: 'sms',
      required: true,
    },
    community: {
      type: String,
      required: [true, 'Community is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Program start date is required'],
    },
    isMinor: {
      type: Boolean,
      default: false,
      required: true,
    },
    kitDistributed: {
      type: Boolean,
      default: true,
    },
    consent: {
      given: {
        type: Boolean,
        required: [true, 'Informed consent is required'],
        validate: {
          validator: (v) => v === true,
          message: 'Registration cannot be completed without informed consent',
        },
      },
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      recordedByName: {
        type: String,
        required: true,
        trim: true,
      },
      recordedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      guardianConsentGiven: {
        type: Boolean,
        default: false,
      },
      guardianName: {
        type: String,
        trim: true,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['active', 'opted_out', 'completed'],
      default: 'active',
    },
    optedOutAt: {
      type: Date,
      default: null,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

beneficiarySchema.pre('validate', function validateMinorConsent() {
  if (this.isMinor) {
    if (!this.consent?.guardianConsentGiven) {
      this.invalidate(
        'consent.guardianConsentGiven',
        'Parent or guardian consent is required for beneficiaries under 18'
      );
    }
    if (!this.consent?.guardianName || !this.consent.guardianName.trim()) {
      this.invalidate(
        'consent.guardianName',
        'Parent or guardian name is required for beneficiaries under 18'
      );
    }
  }
});

export default mongoose.model('Beneficiary', beneficiarySchema);
