import express from 'express';
import cors from 'cors';
// import path from "path";
import cookieParser from 'cookie-parser';

//Routes
import userRoutes from './router/user.route.js';
import zoneRoutes from './router/zone.route.js';
import alertRoutes from './router/alert.route.js';
import activityRoute from './router/activity.route.js';
import cameraRoutes from './router/camera.route.js';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// CORS middleware - MUST come before helmet and rate-limiter to handle preflight requests
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(frontendUrl ? frontendUrl.split(',').map((origin) => origin.trim()) : []),
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// Security Middleware - configured to not conflict with CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Rate Limiters - Route-specific
// Strict limiter for authentication endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes for login/register
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// General limiter for standard API endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});

// Add Json body parser middleware
app.use(express.json({ limit: '10mb' }));
// Add URL encoded body parser middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// // Serve static files from React build
// const buildPath = path.join(__dirname, "../../frontend/dist");
// app.use(express.static(buildPath));

// Routes with rate limiting
// Auth routes - strict rate limiting (brute-force protection)
app.use('/api/v1/users', authLimiter, userRoutes);

// AI Module routes - NO rate limiting (high-frequency from AI module)
app.use('/api/v1/activity', activityRoute);
app.use('/api/v1/alerts', alertRoutes);

// Standard routes - general rate limiting
app.use('/api/v1/zones', generalLimiter, zoneRoutes);
app.use('/api/v1/cameras', generalLimiter, cameraRoutes);

export { app };
