import SchedulerRun from '../models/SchedulerRun.js';
import { runDailyScheduler } from '../services/schedulerService.js';

export const triggerSchedulerNow = async (req, res) => {
  try {
    const { date, community } = req.body || {};

    const communityFilter =
      req.user.role === 'volunteer' && req.user.community !== 'All'
        ? req.user.community
        : community || null;

    const result = await runDailyScheduler({
      targetDate: date || new Date(),
      triggerType: 'manual_demo',
      triggeredBy: req.user._id,
      communityFilter,
    });

    return res.json({
      message: 'Scheduler run completed.',
      run: result.run,
      details: result.details,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Scheduler run failed.', error: error.message });
  }
};

export const getSchedulerRuns = async (req, res) => {
  try {
    const runs = await SchedulerRun.find()
      .populate('triggeredBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({ runs });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load scheduler runs.', error: error.message });
  }
};
