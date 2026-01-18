import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authenticateApiKeyOrToken } from '../middleware/apiKeyAuth.js';
import {
  createActivity,
  getAllActivities,
  getStatsOfActivities,
} from '../controller/activity.controller.js';

const router = Router();

router.post('/', authenticateApiKeyOrToken, createActivity);
router.get('/', authenticate, getAllActivities);
router.get('/stats', authenticateApiKeyOrToken, getStatsOfActivities);

export default router;
