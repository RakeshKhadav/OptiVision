import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { createZone, getZones, deleteZone } from '../controller/zone.controller.js';

const router = Router();

router.post('/', authenticate, createZone);
router.get('/', authenticate, getZones);
router.delete('/:id', authenticate, deleteZone);
// router.delete('/:id', authenticate, requireAdmin, deleteZone);

export default router;
