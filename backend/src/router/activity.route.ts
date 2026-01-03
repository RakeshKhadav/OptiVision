import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createActivity,
  getAllActivities,
  getStatsOfActivities,
} from '../controller/activity.controller.js';

const router = Router();

router.post('/', authenticate, createActivity);
router.get('/', authenticate, getAllActivities);
router.get('/stats', authenticate, getStatsOfActivities);

export default router;
