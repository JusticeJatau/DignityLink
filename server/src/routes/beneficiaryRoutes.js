import express from 'express';
import {
  listBeneficiaries,
  optOutBeneficiary,
  registerBeneficiary,
} from '../controllers/beneficiaryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', listBeneficiaries);
router.post('/', registerBeneficiary);
router.patch('/:id/opt-out', optOutBeneficiary);

export default router;
