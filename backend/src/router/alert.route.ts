import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createAlert, getAlert, resolveAlert } from '../controller/alert.controller.js';

const router = Router();

router.post('/', authenticate, createAlert);
router.get('/', authenticate, getAlert);

router.patch('/:id/resolve', authenticate, resolveAlert);

export default router;
