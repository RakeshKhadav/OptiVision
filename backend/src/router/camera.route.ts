import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createCamera,
  getCameras,
  getCameraById,
  updateCamera,
  deleteCamera,
} from '../controller/camera.controller.js';

const router = Router();

router.post('/', authenticate, createCamera);
router.get('/', authenticate, getCameras);
router.get('/:id', authenticate, getCameraById);
router.patch('/:id', authenticate, updateCamera);
router.delete('/:id', authenticate, deleteCamera);

export default router;
