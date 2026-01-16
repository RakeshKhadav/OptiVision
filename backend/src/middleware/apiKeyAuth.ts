import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utility/ApiError.js';
import { authenticate } from './auth.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateApiKeyOrToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    // If API key header is present, validate it
    const validApiKey = process.env.AI_API_KEY;

    if (apiKey === validApiKey) {
      // Valid API Key - Inject system user
      req.user = {
        id: 'ai-module',
        email: 'ai@optivision.system',
        role: 'ADMIN',
      };
      return next();
    } else {
      // Invalid API Key - Fail immediately
      return next(new ApiError(401, 'Invalid API Key'));
    }
  }

  // If no API key, fall back to standard JWT authentication
  return authenticate(req, res, next);
};
