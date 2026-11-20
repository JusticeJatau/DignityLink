import Beneficiary from '../models/Beneficiary.js';
import MessageTemplate from '../models/MessageTemplate.js';
import MessageLog from '../models/MessageLog.js';
import Feedback from '../models/Feedback.js';
import { getProviderForChannel, getProviderConfigurationStatus } from '../providers/providerFactory.js';
import { normalizePhone } from '../utils/phone.js';

export const getMessageLibrary = async (req, res) => {
  try {
    const { language, week, theme } = req.query;
    const filter = {};
    if (language && language !== 'all') filter.language = language;
    if (week && week !== 'all') filter.week = Number(week);
    if (theme && theme !== 'all') filter.theme = theme;

    const templates = await MessageTemplate.find(filter).sort({
      week: 1,
      slot: 1,
      language: 1,
    });

    return res.json({ templates });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load message library.', error: error.message });
  }
};

export const updateMessageTemplate = async (req, res) => {
  try {
    const { body, theme, reviewStatus, isActive } = req.body;

    if (body !== undefined && body.trim().length > 160) {
      return res.status(400).json({
        message: 'Message body must stay under 160 characters to fit in one SMS.',
      });
    }

    const template = await MessageTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Message template not found.' });
    }

    if (body !== undefined) template.body = body.trim();
    if (theme !== undefined) template.theme = theme;
    if (reviewStatus !== undefined) template.reviewStatus = reviewStatus;
    if (isActive !== undefined) template.isActive = Boolean(isActive);

    await template.save();
    return res.json({ message: 'Message template updated.', template });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update template.', error: error.message });
  }
};

export const getMessageLogs = async (req, res) => {
  try {
    const { channel, status, direction, limit = 100 } = req.query;

    let allowedBeneficiaryIds = null;
    if (req.user.role === 'volunteer' && req.user.community !== 'All') {
      const communityBeneficiaries = await Beneficiary.find({
        community: req.user.community,
      }).select('_id');
      allowedBeneficiaryIds = communityBeneficiaries.map((b) => b._id);
    }

    const filter = {};
    if (allowedBeneficiaryIds) filter.beneficiary = { $in: allowedBeneficiaryIds };
    if (channel && channel !== 'all') filter.channel = channel;
    if (status && status !== 'all') filter.status = status;
    if (direction && direction !== 'all') filter.direction = direction;

    const logs = await MessageLog.find(filter)
      .populate('beneficiary', 'name phone community channel preferredLanguage status')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 300));

    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load message logs.', error: error.message });
  }
};

export const getBeneficiaryThread = async (req, res) => {
  try {
    const { beneficiaryId } = req.params;
    const beneficiary = await Beneficiary.findById(beneficiaryId);
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found.' });
    }

    if (
      req.user.role === 'volunteer' &&
      req.user.community !== 'All' &&
      beneficiary.community !== req.user.community
    ) {
      return res.status(403).json({ message: 'Access denied outside your assigned community.' });
    }

    const messages = await MessageLog.find({ beneficiary: beneficiary._id }).sort({
      createdAt: 1,
    });

    const feedbacks = await Feedback.find({ beneficiary: beneficiary._id }).sort({
      createdAt: -1,
    });

    return res.json({ beneficiary, messages, feedbacks });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load phone thread.', error: error.message });
  }
};

export const handleInboundMessage = async (req, res) => {
  try {
    const { beneficiaryId, phone, text } = req.body;
    const trimmed = String(text || '').trim();

    if (!trimmed) {
      return res.status(400).json({ message: 'Reply text cannot be empty.' });
    }

    let beneficiary = null;
    if (beneficiaryId) {
      beneficiary = await Beneficiary.findById(beneficiaryId);
    } else if (phone) {
      beneficiary = await Beneficiary.findOne({ phone: normalizePhone(phone) });
    }

    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found.' });
    }

    if (
      req.user.role === 'volunteer' &&
      req.user.community !== 'All' &&
      beneficiary.community !== req.user.community
    ) {
      return res.status(403).json({ message: 'Access denied outside your assigned community.' });
    }

    const provider = getProviderForChannel(beneficiary.channel);
    const parsed = provider.parseInboundPayload({ from: beneficiary.phone, text: trimmed });

    const inboundLog = await MessageLog.create({
      beneficiary: beneficiary._id,
      language: beneficiary.preferredLanguage,
      channel: beneficiary.channel,
      provider: provider.providerName,
      recipientPhone: beneficiary.phone,
      messageBody: parsed.text,
      direction: 'inbound',
      status: 'received',
      externalMessageId: parsed.externalMessageId,
      providerRequest: { simulatedInbound: true, from: beneficiary.phone, text: parsed.text },
      providerResponse: { accepted: true, timestamp: new Date().toISOString() },
      triggerType: 'inbound_reply',
    });

    const lastOutbound = await MessageLog.findOne({
      beneficiary: beneficiary._id,
      direction: 'outbound',
    }).sort({ createdAt: -1 });

    const upper = parsed.text.toUpperCase();
    let replyCode = 'OTHER';
    let category = 'other';
    let autoReplyBody = '';

    if (upper === 'STOP' || upper === 'UNSUBSCRIBE') {
      replyCode = 'STOP';
      category = 'opt_out';
      beneficiary.status = 'opted_out';
      beneficiary.optedOutAt = new Date();
      await beneficiary.save();

      autoReplyBody =
        beneficiary.preferredLanguage === 'ha'
          ? 'An dakatar da sakonnin DignityLink. Ba za ki sake karba ba.'
          : 'You have been unsubscribed from DignityLink messages. You will receive no further messages.';
    } else if (upper === '1') {
      replyCode = '1';
      category = 'helpful';
      autoReplyBody =
        beneficiary.preferredLanguage === 'ha'
          ? 'Mun gode da amsarki. Muna farin ciki sakon ya taimaka.'
          : 'Thank you for your feedback! We are glad the message was helpful.';
    } else if (upper === '2') {
      replyCode = '2';
      category = 'question';
      autoReplyBody =
        beneficiary.preferredLanguage === 'ha'
          ? 'Mun karbi sakonki. Mai sa kai zai tuntube ki don taimako.'
          : 'Thank you. A local community volunteer has been notified to follow up with you.';
    } else {
      autoReplyBody =
        beneficiary.preferredLanguage === 'ha'
          ? 'Amsa 1 idan ya taimaka, 2 don tambaya, ko STOP don dakatarwa.'
          : 'Reply 1 if helpful, 2 if you have a question, or STOP to stop messages.';
    }

    const feedback = await Feedback.create({
      beneficiary: beneficiary._id,
      community: beneficiary.community,
      channel: beneficiary.channel,
      rawReply: parsed.text,
      replyCode,
      category,
      relatedMessageLog: lastOutbound ? lastOutbound._id : null,
      resolved: category !== 'question',
    });

    const ackDispatch = await provider.sendMessage({
      to: beneficiary.phone,
      body: autoReplyBody,
      metadata: {
        beneficiaryId: String(beneficiary._id),
        type: 'system_acknowledgement',
      },
    });

    const ackLog = await MessageLog.create({
      beneficiary: beneficiary._id,
      language: beneficiary.preferredLanguage,
      channel: beneficiary.channel,
      provider: ackDispatch.provider,
      recipientPhone: beneficiary.phone,
      messageBody: autoReplyBody,
      direction: 'outbound',
      status: ackDispatch.status,
      externalMessageId: ackDispatch.externalMessageId,
      providerRequest: ackDispatch.rawRequest,
      providerResponse: ackDispatch.rawResponse,
      latencyMs: ackDispatch.latencyMs,
      triggerType: 'system_notice',
    });

    return res.status(201).json({
      message: 'Inbound reply processed.',
      beneficiary,
      inboundLog,
      acknowledgementLog: ackLog,
      feedback,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process inbound reply.', error: error.message });
  }
};

export const getProviderStatus = async (req, res) => {
  return res.json(getProviderConfigurationStatus());
};
