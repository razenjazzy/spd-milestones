import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import projectRoutes from "./routes/projectRoutes";
import milestoneRoutes from "./routes/milestoneRoutes";
import activityRoutes from "./routes/activityRoutes";
import aiRoutes from "./routes/aiRoutes";
import authRoutes from "./routes/authRoutes";
import releaseRoutes from "./routes/releaseRoutes";
import userRoutes from "./routes/userRoutes";
import settingRoutes from "./routes/settingRoutes";
import monitoringRoutes from "./routes/monitoringRoutes";
import testRoutes from "./routes/testRoutes";
import errorHandler from "./middlewares/errorHandler";
import { authenticate } from "./middlewares/authMiddleware";
import { requestLogger } from "./middlewares/requestLogger";
import { timeoutHandler } from "./middlewares/timeoutHandler";
import { logger } from "./utils/logger";
import { config } from "./config/env";

const app = express();

// Middleware
const allowedOrigins = config.allowedOrigins;
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: !allowedOrigins.includes('*'),
}));
app.use(express.json({ limit: config.maxRequestSize }));
app.use(timeoutHandler(25000)); // 25 second timeout for all requests
app.use(requestLogger); // Log all HTTP requests

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  logger.debug('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Compatibility alias for proxy/API-prefixed health checks
app.get('/api/health', (req: Request, res: Response) => {
  logger.debug('API health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use("/api/auth", authRoutes);

// API routes
app.use("/api/projects", authenticate, projectRoutes);
app.use("/api/milestones", authenticate, milestoneRoutes);
app.use("/api/activities", authenticate, activityRoutes);
app.use("/api/releases", releaseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/ai", authenticate, aiRoutes);
// nested milestone routes under projects for frontend usage
app.use("/api/projects/:projectId/milestones", authenticate, milestoneRoutes);
app.use("/api/projects/:projectId/activities", authenticate, activityRoutes);
app.use("/api/projects/:projectId/releases", releaseRoutes);
app.use("/api/releases/:releaseId/activities", authenticate, activityRoutes);
// Monitoring and testing routes
app.use("/api/monitoring", authenticate, monitoringRoutes);
app.use("/api/tests", authenticate, testRoutes);

export const registerFallbackHandlers = () => {
  app.use((req: Request, res: Response) => {
    logger.warn('Route not found', { method: req.method, path: req.path });
    res.status(404).json({ message: 'Route not found' });
  });

  app.use(errorHandler);
};

export default app;
