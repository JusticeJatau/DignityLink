import express from 'express';
import { getSchedulerRuns, triggerSchedulerNow } from '../controllers/schedulerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/run', triggerSchedulerNow);
router.get('/runs', getSchedulerRuns);

export default router;
