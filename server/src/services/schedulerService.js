import cron from 'node-cron';
import Beneficiary from '../models/Beneficiary.js';
import MessageTemplate from '../models/MessageTemplate.js';
import MessageLog from '../models/MessageLog.js';
import SchedulerRun from '../models/SchedulerRun.js';
import { getProviderForChannel } from '../providers/providerFactory.js';

export const toUtcDateOnly = (input = new Date()) => {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const [y, m, d] = input.trim().split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return { date, isoDate: input.trim() };
  }
  const parsed = new Date(input);
  const date = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
  );
  const isoDate = date.toISOString().slice(0, 10);
  return { date, isoDate };
};

/**
 * Schedule from DignityLink Proposal Section 5:
 * - Weeks 1 to 4: Monday (slot 1), Wednesday (slot 2), Friday (slot 3)
 * - Weeks 5 to 12: Tuesday (slot 1), Friday (slot 2)
 */
export const evaluateDueSchedule = (startDate, targetUtcDate) => {
  const { date: startUtc } = toUtcDateOnly(startDate);
  const diffDays = Math.floor(
    (targetUtcDate.getTime() - startUtc.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return { status: 'not_started', week: 0, slot: null };
  }

  const week = Math.floor(diffDays / 7) + 1;
  if (week > 12) {
    return { status: 'program_completed', week, slot: null };
  }

  const dayOfWeek = targetUtcDate.getUTCDay(); // 0=Sun..6=Sat

  if (week >= 1 && week <= 4) {
    const map = { 1: 1, 3: 2, 5: 3 };
    const slot = map[dayOfWeek] || null;
    return { status: slot ? 'due' : 'rest_day', week, slot };
  }

  const map = { 2: 1, 5: 2 };
  const slot = map[dayOfWeek] || null;
  return { status: slot ? 'due' : 'rest_day', week, slot };
};

export const runDailyScheduler = async ({
  targetDate = new Date(),
  triggerType = 'cron',
  triggeredBy = null,
  communityFilter = null,
} = {}) => {
  const startedAt = Date.now();
  const { date: targetUtcDate, isoDate } = toUtcDateOnly(targetDate);

  const query = { status: 'active' };
  if (communityFilter && communityFilter !== 'All') {
    query.community = communityFilter;
  }

  const activeBeneficiaries = await Beneficiary.find(query);

  let dueCount = 0;
  let sentCount = 0;
  let skippedAlreadySent = 0;
  let failedCount = 0;
  const details = [];

  for (const beneficiary of activeBeneficiaries) {
    if (!beneficiary.consent?.given) continue;
    if (beneficiary.isMinor && !beneficiary.consent?.guardianConsentGiven) continue;

    const evaluation = evaluateDueSchedule(beneficiary.startDate, targetUtcDate);

    if (evaluation.status === 'program_completed') {
      beneficiary.status = 'completed';
      await beneficiary.save();
      details.push({
        beneficiaryId: beneficiary._id,
        name: beneficiary.name,
        outcome: 'completed_program',
        reason: 'Completed 12-week curriculum',
      });
      continue;
    }

    if (evaluation.status !== 'due') {
      continue;
    }

    dueCount += 1;
    const { week, slot } = evaluation;

    const existing = await MessageLog.findOne({
      beneficiary: beneficiary._id,
      week,
      slot,
      direction: 'outbound',
      status: { $in: ['sent', 'delivered'] },
    });

    if (existing) {
      skippedAlreadySent += 1;
      details.push({
        beneficiaryId: beneficiary._id,
        name: beneficiary.name,
        week,
        slot,
        outcome: 'skipped_duplicate',
        reason: `Week ${week} Slot ${slot} already delivered`,
      });
      continue;
    }

    const template = await MessageTemplate.findOne({
      week,
      slot,
      language: beneficiary.preferredLanguage,
      isActive: true,
    });

    if (!template) {
      failedCount += 1;
      details.push({
        beneficiaryId: beneficiary._id,
        name: beneficiary.name,
        week,
        slot,
        outcome: 'failed',
        reason: `No active template for Week ${week} Slot ${slot} (${beneficiary.preferredLanguage})`,
      });
      continue;
    }

    const provider = getProviderForChannel(beneficiary.channel);
    const dispatchResult = await provider.sendMessage({
      to: beneficiary.phone,
      body: template.body,
      metadata: {
        beneficiaryId: String(beneficiary._id),
        week,
        slot,
        language: beneficiary.preferredLanguage,
        community: beneficiary.community,
      },
    });

    const logEntry = await MessageLog.create({
      beneficiary: beneficiary._id,
      template: template._id,
      week,
      slot,
      language: beneficiary.preferredLanguage,
      channel: beneficiary.channel,
      provider: dispatchResult.provider,
      recipientPhone: beneficiary.phone,
      messageBody: template.body,
      direction: 'outbound',
      status: dispatchResult.status,
      externalMessageId: dispatchResult.externalMessageId,
      providerRequest: dispatchResult.rawRequest,
      providerResponse: dispatchResult.rawResponse,
      errorMessage: dispatchResult.errorMessage,
      latencyMs: dispatchResult.latencyMs,
      scheduledForDate: isoDate,
      triggerType,
    });

    if (dispatchResult.success) {
      sentCount += 1;
      details.push({
        beneficiaryId: beneficiary._id,
        name: beneficiary.name,
        channel: beneficiary.channel,
        provider: dispatchResult.provider,
        week,
        slot,
        externalMessageId: dispatchResult.externalMessageId,
        logId: logEntry._id,
        outcome: 'sent',
      });
    } else {
      failedCount += 1;
      details.push({
        beneficiaryId: beneficiary._id,
        name: beneficiary.name,
        week,
        slot,
        outcome: 'failed',
        reason: dispatchResult.errorMessage,
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  const summaryNotes = `Date ${isoDate}: evaluated ${activeBeneficiaries.length}, due ${dueCount}, sent ${sentCount}, skipped ${skippedAlreadySent}, failed ${failedCount}.`;

  const runRecord = await SchedulerRun.create({
    runDate: isoDate,
    triggerType,
    triggeredBy,
    evaluatedBeneficiaries: activeBeneficiaries.length,
    dueCount,
    sentCount,
    skippedAlreadySent,
    failedCount,
    durationMs,
    summaryNotes,
  });

  return {
    run: runRecord,
    details,
  };
};

let cronTask = null;

export const startDailyCron = () => {
  if (cronTask) return cronTask;
  const enabled = process.env.ENABLE_CRON !== 'false';
  if (!enabled) {
    console.log('[Scheduler] Daily node-cron is disabled via ENABLE_CRON=false.');
    return null;
  }

  const expression = process.env.SCHEDULER_CRON || '0 8 * * *';
  if (!cron.validate(expression)) {
    throw new Error(`Invalid SCHEDULER_CRON expression: ${expression}`);
  }

  cronTask = cron.schedule(expression, async () => {
    console.log(`[Scheduler] Executing daily cron job (${expression})...`);
    try {
      const result = await runDailyScheduler({ triggerType: 'cron' });
      console.log(`[Scheduler] Cron completed: ${result.run.summaryNotes}`);
    } catch (err) {
      console.error('[Scheduler] Cron execution failed:', err);
    }
  });

  console.log(`[Scheduler] Daily node-cron scheduled with "${expression}"`);
  return cronTask;
};
