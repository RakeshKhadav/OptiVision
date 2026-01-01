import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createZone } from '../controller/zone.controller.js';

const router = Router();

router.post('/', authenticate, createZone);

export default router;
