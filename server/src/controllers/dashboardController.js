import Beneficiary from '../models/Beneficiary.js';
import MessageLog from '../models/MessageLog.js';
import Feedback from '../models/Feedback.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { community } = req.query;

    const beneficiaryScope = {};
    if (req.user.role === 'volunteer' && req.user.community !== 'All') {
      beneficiaryScope.community = req.user.community;
    } else if (community && community !== 'All') {
      beneficiaryScope.community = community;
    }

    const beneficiaries = await Beneficiary.find(beneficiaryScope).lean();
    const beneficiaryIds = beneficiaries.map((b) => b._id);

    // For coordinator community filter dropdown, gather all known communities
    const allCommunitiesList =
      req.user.role === 'coordinator'
        ? await Beneficiary.distinct('community')
        : [req.user.community];

    const [outboundLogs, feedbacks] = await Promise.all([
      MessageLog.find({
        beneficiary: { $in: beneficiaryIds },
        direction: 'outbound',
      }).lean(),
      Feedback.find({
        beneficiary: { $in: beneficiaryIds },
      })
        .populate('beneficiary', 'name phone channel community preferredLanguage')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const totals = {
      registrations: beneficiaries.length,
      active: beneficiaries.filter((b) => b.status === 'active').length,
      optedOut: beneficiaries.filter((b) => b.status === 'opted_out').length,
      completed: beneficiaries.filter((b) => b.status === 'completed').length,
      minorsWithGuardianConsent: beneficiaries.filter(
        (b) => b.isMinor && b.consent?.guardianConsentGiven
      ).length,
      smsBeneficiaries: beneficiaries.filter((b) => b.channel === 'sms').length,
      whatsappBeneficiaries: beneficiaries.filter((b) => b.channel === 'whatsapp').length,
      messagesSent: outboundLogs.filter((l) => l.status === 'delivered' || l.status === 'sent')
        .length,
      messagesFailed: outboundLogs.filter((l) => l.status === 'failed').length,
      smsMessagesSent: outboundLogs.filter(
        (l) => l.channel === 'sms' && (l.status === 'delivered' || l.status === 'sent')
      ).length,
      whatsappMessagesSent: outboundLogs.filter(
        (l) => l.channel === 'whatsapp' && (l.status === 'delivered' || l.status === 'sent')
      ).length,
      helpfulFeedback: feedbacks.filter((f) => f.category === 'helpful').length,
      questionFeedback: feedbacks.filter((f) => f.category === 'question').length,
      unresolvedQuestions: feedbacks.filter((f) => f.category === 'question' && !f.resolved)
        .length,
      optOutFeedback: feedbacks.filter((f) => f.category === 'opt_out').length,
    };

    const beneficiaryById = new Map(beneficiaries.map((b) => [String(b._id), b]));
    const communityMap = new Map();

    const ensureCommunity = (name) => {
      if (!communityMap.has(name)) {
        communityMap.set(name, {
          community: name,
          registrations: 0,
          active: 0,
          optedOut: 0,
          messagesSent: 0,
          helpfulCount: 0,
          questionCount: 0,
        });
      }
      return communityMap.get(name);
    };

    for (const b of beneficiaries) {
      const entry = ensureCommunity(b.community);
      entry.registrations += 1;
      if (b.status === 'active') entry.active += 1;
      if (b.status === 'opted_out') entry.optedOut += 1;
    }

    for (const log of outboundLogs) {
      if (log.status !== 'delivered' && log.status !== 'sent') continue;
      const b = beneficiaryById.get(String(log.beneficiary));
      if (!b) continue;
      ensureCommunity(b.community).messagesSent += 1;
    }

    for (const fb of feedbacks) {
      const entry = ensureCommunity(fb.community);
      if (fb.category === 'helpful') entry.helpfulCount += 1;
      if (fb.category === 'question') entry.questionCount += 1;
    }

    const byCommunity = Array.from(communityMap.values()).sort((a, b) =>
      a.community.localeCompare(b.community)
    );

    return res.json({
      scopeCommunity: req.user.role === 'volunteer' ? req.user.community : community || 'All',
      availableCommunities: allCommunitiesList.filter(Boolean).sort(),
      totals,
      byCommunity,
      recentFeedback: feedbacks.slice(0, 25),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard stats.', error: error.message });
  }
};

export const resolveFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback entry not found.' });
    }

    if (
      req.user.role === 'volunteer' &&
      req.user.community !== 'All' &&
      feedback.community !== req.user.community
    ) {
      return res.status(403).json({ message: 'Access denied outside your assigned community.' });
    }

    feedback.resolved = true;
    if (req.body?.notes) {
      feedback.notes = String(req.body.notes).trim();
    }
    await feedback.save();

    return res.json({ message: 'Feedback marked as followed up.', feedback });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update feedback.', error: error.message });
  }
};
