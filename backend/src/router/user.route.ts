import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controller/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getCurrentUser);

export default router;
