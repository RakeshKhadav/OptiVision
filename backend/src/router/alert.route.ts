import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createAlert, getAlert } from '../controller/alert.controller.js';

const router = Router();

router.post('/', authenticate, createAlert);
router.get('/', authenticate, getAlert);

export default router;
