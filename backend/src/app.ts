import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";

const app = express();

// CORS middleware
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = frontendUrl
  ? frontendUrl.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Add Json body parser middleware
app.use(express.json());
// Add URL encoded body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from React build
const buildPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(buildPath));

export { app };
