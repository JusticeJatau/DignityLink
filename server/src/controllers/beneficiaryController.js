import Beneficiary from '../models/Beneficiary.js';
import { toUtcDateOnly } from '../services/schedulerService.js';

const buildScopeFilter = (user) => {
  if (user.role === 'volunteer' && user.community && user.community !== 'All') {
    return { community: user.community };
  }
  return {};
};

export const listBeneficiaries = async (req, res) => {
  try {
    const scope = buildScopeFilter(req.user);
    const { community, status, search } = req.query;

    const filter = { ...scope };
    if (req.user.role === 'coordinator' && community && community !== 'All') {
      filter.community = community;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { phone: regex }, { community: regex }];
    }

    const beneficiaries = await Beneficiary.find(filter)
      .populate('registeredBy', 'name role')
      .sort({ createdAt: -1 });

    return res.json({ beneficiaries });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load beneficiaries.', error: error.message });
  }
};

export const registerBeneficiary = async (req, res) => {
  try {
    const {
      name,
      phone,
      preferredLanguage,
      channel,
      community,
      startDate,
      isMinor,
      kitDistributed,
      consentGiven,
      guardianConsentGiven,
      guardianName,
    } = req.body;

    const assignedCommunity =
      req.user.role === 'volunteer' && req.user.community !== 'All'
        ? req.user.community
        : community;

    if (!assignedCommunity || !assignedCommunity.trim()) {
      return res.status(400).json({ message: 'Community is required.' });
    }

    if (!consentGiven) {
      return res.status(400).json({
        message: 'Informed consent must be explained and recorded before registration.',
      });
    }

    if (Boolean(isMinor) && (!guardianConsentGiven || !guardianName?.trim())) {
      return res.status(400).json({
        message: 'Parent or guardian consent and name are required for girls under 18.',
      });
    }

    const { date: normalizedStartDate } = toUtcDateOnly(startDate || new Date());

    const beneficiary = await Beneficiary.create({
      name,
      phone,
      preferredLanguage: preferredLanguage || 'en',
      channel: channel || 'sms',
      community: assignedCommunity.trim(),
      startDate: normalizedStartDate,
      isMinor: Boolean(isMinor),
      kitDistributed: kitDistributed !== false,
      consent: {
        given: Boolean(consentGiven),
        recordedBy: req.user._id,
        recordedByName: req.user.name,
        recordedAt: new Date(),
        guardianConsentGiven: Boolean(isMinor) ? Boolean(guardianConsentGiven) : false,
        guardianName: Boolean(isMinor) ? (guardianName || '').trim() : '',
      },
      registeredBy: req.user._id,
    });

    return res.status(201).json({
      message: 'Beneficiary registered with verified consent.',
      beneficiary,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A beneficiary with this phone number is already registered.',
      });
    }
    if (error.name === 'ValidationError') {
      const firstMsg = Object.values(error.errors)[0]?.message || 'Validation failed.';
      return res.status(400).json({ message: firstMsg });
    }
    return res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
};

export const optOutBeneficiary = async (req, res) => {
  try {
    const scope = buildScopeFilter(req.user);
    const beneficiary = await Beneficiary.findOne({ _id: req.params.id, ...scope });
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found in your scope.' });
    }

    beneficiary.status = 'opted_out';
    beneficiary.optedOutAt = new Date();
    await beneficiary.save();

    return res.json({
      message: `${beneficiary.name} has been opted out. Scheduler will skip future messages.`,
      beneficiary,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to opt out beneficiary.', error: error.message });
  }
};
