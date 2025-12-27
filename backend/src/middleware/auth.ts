import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utility/ApiError";
import { verifyToken } from "../utility/jwt";
import { asyncHandler } from "../utility/asyncHandler";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Middleware to verify JWT token
export const authenticate = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer")) {
        throw new ApiError(401, "Access token is required");
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        throw new ApiError(401, "Access token is required");
      }

      // Verify the token
      const decoded = verifyToken(token);

      // Attach user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(401, "Invalid or expired token");
    }
  }
);

// Middleware to check if user is admin
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required");
  }

  next();
};

// Middleware to check if user is authenticated (for optional auth)
export const optionalAuth = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);

        if (token) {
          try {
            const decoded = verifyToken(token);
            req.user = {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
            };
          } catch (error) {
            // Invalid token, but continue without authentication
            console.warn("Invalid token in optional auth:", error);
          }
        }
      }

      next();
    } catch (error) {
      // For optional auth, we don't throw errors
      next();
    }
  }
);
