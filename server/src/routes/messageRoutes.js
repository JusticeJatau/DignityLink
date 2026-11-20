import express from 'express';
import {
  getBeneficiaryThread,
  getMessageLibrary,
  getMessageLogs,
  getProviderStatus,
  handleInboundMessage,
  updateMessageTemplate,
} from '../controllers/messageController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/library', getMessageLibrary);
router.put('/library/:id', requireRole('coordinator'), updateMessageTemplate);
router.get('/logs', getMessageLogs);
router.get('/providers/status', getProviderStatus);
router.get('/thread/:beneficiaryId', getBeneficiaryThread);
router.post('/inbound', handleInboundMessage);

export default router;
