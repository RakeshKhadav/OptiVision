import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createAlert } from '../controller/alert.controller.js';

const router = Router();

router.post('/', authenticate, createAlert);

export default router;
