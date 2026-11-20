import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'url';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Beneficiary from '../models/Beneficiary.js';
import MessageTemplate from '../models/MessageTemplate.js';
import MessageLog from '../models/MessageLog.js';
import Feedback from '../models/Feedback.js';
import SchedulerRun from '../models/SchedulerRun.js';
import { CURRICULUM_28 } from './messageCurriculum.js';
import { MockSmsProvider } from '../providers/MockSmsProvider.js';
import { MockWhatsAppProvider } from '../providers/MockWhatsAppProvider.js';

dotenv.config();

const daysAgoUtc = (days) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
};

export const ensureSeeded = async ({ reset = false } = {}) => {
  if (reset) {
    console.log('Resetting existing DignityLink collections...');
    await Promise.all([
      User.deleteMany({}),
      Beneficiary.deleteMany({}),
      MessageTemplate.deleteMany({}),
      MessageLog.deleteMany({}),
      Feedback.deleteMany({}),
      SchedulerRun.deleteMany({}),
    ]);
  }

  const existingUsers = await User.countDocuments();
  const existingTemplates = await MessageTemplate.countDocuments();
  if (!reset && existingUsers > 0 && existingTemplates >= 56) {
    return;
  }

  // 1. Seed Users (Coordinator + 2 Community Volunteers)
  const passwordHash = await bcrypt.hash('Dignity2026!', 10);
  const seedUsers = [
    {
      name: 'Amina Bello',
      email: 'coordinator@dignitylink.org',
      passwordHash,
      role: 'coordinator',
      community: 'All',
      lga: 'Borno Coordination (3 LGAs)',
    },
    {
      name: 'Hauwa Musa',
      email: 'volunteer.bakassi@dignitylink.org',
      passwordHash,
      role: 'volunteer',
      community: 'Bakassi IDP Camp',
      lga: 'Jere LGA',
    },
    {
      name: 'Grace Danjuma',
      email: 'volunteer.konduga@dignitylink.org',
      passwordHash,
      role: 'volunteer',
      community: 'Konduga Rural',
      lga: 'Konduga LGA',
    },
  ];

  const usersByEmail = {};
  for (const u of seedUsers) {
    const existing = await User.findOne({ email: u.email });
    usersByEmail[u.email] = existing || (await User.create(u));
  }

  const coordinator = usersByEmail['coordinator@dignitylink.org'];
  const volBakassi = usersByEmail['volunteer.bakassi@dignitylink.org'];
  const volKonduga = usersByEmail['volunteer.konduga@dignitylink.org'];

  // 2. Seed 28-Message Curriculum (56 templates: EN + HA)
  for (const item of CURRICULUM_28) {
    for (const lang of ['en', 'ha']) {
      await MessageTemplate.findOneAndUpdate(
        { week: item.week, slot: item.slot, language: lang },
        {
          week: item.week,
          slot: item.slot,
          sequenceNumber: item.sequenceNumber,
          dayLabel: item.dayLabel,
          language: lang,
          theme: item.theme,
          body: item[lang],
          reviewStatus: 'prototype_draft',
          isActive: true,
        },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
    }
  }
  console.log('Seeded 56 message templates (28 English + 28 Hausa).');

  // 3. Seed realistic beneficiaries across 3 communities if none exist
  const existingCount = await Beneficiary.countDocuments();
  if (existingCount === 0) {
    const sampleBeneficiaries = [
      {
        name: 'Fatima Abubakar',
        phone: '+2348031001001',
        preferredLanguage: 'ha',
        channel: 'sms',
        community: 'Bakassi IDP Camp',
        startDate: daysAgoUtc(10),
        isMinor: false,
        kitDistributed: true,
        consent: {
          given: true,
          recordedBy: volBakassi._id,
          recordedByName: volBakassi.name,
          recordedAt: daysAgoUtc(10),
        },
        registeredBy: volBakassi._id,
      },
      {
        name: 'Zainab Ibrahim',
        phone: '+2348031001002',
        preferredLanguage: 'en',
        channel: 'whatsapp',
        community: 'Bakassi IDP Camp',
        startDate: daysAgoUtc(3),
        isMinor: true,
        kitDistributed: true,
        consent: {
          given: true,
          recordedBy: volBakassi._id,
          recordedByName: volBakassi.name,
          recordedAt: daysAgoUtc(3),
          guardianConsentGiven: true,
          guardianName: 'Mariam Ibrahim (Mother)',
        },
        registeredBy: volBakassi._id,
      },
      {
        name: 'Aisha Bukar',
        phone: '+2348031001003',
        preferredLanguage: 'ha',
        channel: 'sms',
        community: 'Bakassi IDP Camp',
        startDate: daysAgoUtc(32),
        isMinor: false,
        kitDistributed: true,
        status: 'opted_out',
        optedOutAt: daysAgoUtc(5),
        consent: {
          given: true,
          recordedBy: volBakassi._id,
          recordedByName: volBakassi.name,
          recordedAt: daysAgoUtc(32),
        },
        registeredBy: volBakassi._id,
      },
      {
        name: 'Maryam Yakubu',
        phone: '+2348052002001',
        preferredLanguage: 'en',
        channel: 'sms',
        community: 'Konduga Rural',
        startDate: daysAgoUtc(14),
        isMinor: false,
        kitDistributed: true,
        consent: {
          given: true,
          recordedBy: volKonduga._id,
          recordedByName: volKonduga.name,
          recordedAt: daysAgoUtc(14),
        },
        registeredBy: volKonduga._id,
      },
      {
        name: 'Halima Usman',
        phone: '+2348052002002',
        preferredLanguage: 'ha',
        channel: 'whatsapp',
        community: 'Konduga Rural',
        startDate: daysAgoUtc(35),
        isMinor: true,
        kitDistributed: true,
        consent: {
          given: true,
          recordedBy: volKonduga._id,
          recordedByName: volKonduga.name,
          recordedAt: daysAgoUtc(35),
          guardianConsentGiven: true,
          guardianName: 'Sadiya Usman (Aunt)',
        },
        registeredBy: volKonduga._id,
      },
      {
        name: 'Rabi Lawan',
        phone: '+2348093003001',
        preferredLanguage: 'en',
        channel: 'sms',
        community: 'Muna Garage Camp',
        startDate: daysAgoUtc(7),
        isMinor: false,
        kitDistributed: true,
        consent: {
          given: true,
          recordedBy: coordinator._id,
          recordedByName: coordinator.name,
          recordedAt: daysAgoUtc(7),
        },
        registeredBy: coordinator._id,
      },
    ];

    const insertedBeneficiaries = await Beneficiary.insertMany(sampleBeneficiaries);
    const mockSms = new MockSmsProvider();
    const mockWa = new MockWhatsAppProvider();

    for (const b of insertedBeneficiaries) {
      const t1 = await MessageTemplate.findOne({
        week: 1,
        slot: 1,
        language: b.preferredLanguage,
      });
      const provider = b.channel === 'whatsapp' ? mockWa : mockSms;
      const res1 = await provider.sendMessage({
        to: b.phone,
        body: t1.body,
        metadata: { beneficiaryId: String(b._id), week: 1, slot: 1 },
      });

      const log1 = await MessageLog.create({
        beneficiary: b._id,
        template: t1._id,
        week: 1,
        slot: 1,
        language: b.preferredLanguage,
        channel: b.channel,
        provider: res1.provider,
        recipientPhone: b.phone,
        messageBody: t1.body,
        direction: 'outbound',
        status: res1.status,
        externalMessageId: res1.externalMessageId,
        providerRequest: res1.rawRequest,
        providerResponse: res1.rawResponse,
        latencyMs: res1.latencyMs,
        scheduledForDate: b.startDate.toISOString().slice(0, 10),
        triggerType: 'cron',
      });

      if (b.name === 'Fatima Abubakar' || b.name === 'Maryam Yakubu') {
        await MessageLog.create({
          beneficiary: b._id,
          language: b.preferredLanguage,
          channel: b.channel,
          provider: res1.provider,
          recipientPhone: b.phone,
          messageBody: '1',
          direction: 'inbound',
          status: 'received',
          externalMessageId: `in-${String(b._id).slice(-6)}`,
          providerRequest: { simulatedInbound: true, from: b.phone, text: '1' },
          providerResponse: { accepted: true },
          triggerType: 'inbound_reply',
        });
        await Feedback.create({
          beneficiary: b._id,
          community: b.community,
          channel: b.channel,
          rawReply: '1',
          replyCode: '1',
          category: 'helpful',
          relatedMessageLog: log1._id,
          resolved: true,
        });
      }

      if (b.name === 'Halima Usman') {
        await MessageLog.create({
          beneficiary: b._id,
          language: b.preferredLanguage,
          channel: b.channel,
          provider: res1.provider,
          recipientPhone: b.phone,
          messageBody: '2',
          direction: 'inbound',
          status: 'received',
          externalMessageId: `in-${String(b._id).slice(-6)}`,
          providerRequest: { simulatedInbound: true, from: b.phone, text: '2' },
          providerResponse: { accepted: true },
          triggerType: 'inbound_reply',
        });
        await Feedback.create({
          beneficiary: b._id,
          community: b.community,
          channel: b.channel,
          rawReply: '2',
          replyCode: '2',
          category: 'question',
          relatedMessageLog: log1._id,
          resolved: false,
        });
      }

      if (b.status === 'opted_out') {
        await MessageLog.create({
          beneficiary: b._id,
          language: b.preferredLanguage,
          channel: b.channel,
          provider: res1.provider,
          recipientPhone: b.phone,
          messageBody: 'STOP',
          direction: 'inbound',
          status: 'received',
          externalMessageId: `in-${String(b._id).slice(-6)}`,
          providerRequest: { simulatedInbound: true, from: b.phone, text: 'STOP' },
          providerResponse: { accepted: true },
          triggerType: 'inbound_reply',
        });
        await Feedback.create({
          beneficiary: b._id,
          community: b.community,
          channel: b.channel,
          rawReply: 'STOP',
          replyCode: 'STOP',
          category: 'opt_out',
          relatedMessageLog: log1._id,
          resolved: true,
        });
      }
    }

    await SchedulerRun.create({
      runDate: new Date().toISOString().slice(0, 10),
      triggerType: 'cron',
      evaluatedBeneficiaries: 5,
      dueCount: 3,
      sentCount: 3,
      skippedAlreadySent: 0,
      failedCount: 0,
      durationMs: 240,
      summaryNotes: 'Seeded initial demonstration scheduler history.',
    });

    console.log('Seeded 6 beneficiaries across 3 communities with delivery logs and feedback.');
  }
};

// Allow running directly via `node src/seed/seed.js`
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const shouldReset = process.argv.includes('--reset');
  connectDB()
    .then(() => ensureSeeded({ reset: shouldReset }))
    .then(() => disconnectDB())
    .then(() => {
      console.log('Database seeding complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
