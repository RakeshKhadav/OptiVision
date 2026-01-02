import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createActivity } from '../controller/activity.controller.js';

const router = Router();

router.post('/', authenticate, createActivity);

export default router;
