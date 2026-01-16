import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authenticateApiKeyOrToken } from '../middleware/apiKeyAuth.js';
import { createAlert, getAlert, resolveAlert } from '../controller/alert.controller.js';

const router = Router();

router.post('/', authenticateApiKeyOrToken, createAlert);
router.get('/', authenticate, getAlert);

router.patch('/:id/resolve', authenticate, resolveAlert);

export default router;
