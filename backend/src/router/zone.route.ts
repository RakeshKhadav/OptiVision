import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { authenticateApiKeyOrToken } from '../middleware/apiKeyAuth.js';
import { createZone, getZones, deleteZone } from '../controller/zone.controller.js';

const router = Router();

router.post('/', authenticate, createZone);
router.get('/', authenticateApiKeyOrToken, getZones);
router.delete('/:id', authenticate, deleteZone);
// router.delete('/:id', authenticate, requireAdmin, deleteZone);

export default router;
