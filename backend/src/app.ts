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

// Security Middleware
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// CORS middleware
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
  })
);

// Add Json body parser middleware
app.use(express.json({ limit: '10mb' }));
// Add URL encoded body parser middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// // Serve static files from React build
// const buildPath = path.join(__dirname, "../../frontend/dist");
// app.use(express.static(buildPath));

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/zones', zoneRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/activity', activityRoute);
app.use('/api/v1/cameras', cameraRoutes);

export { app };
