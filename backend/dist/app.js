"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFallbackHandlers = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const milestoneRoutes_1 = __importDefault(require("./routes/milestoneRoutes"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const releaseRoutes_1 = __importDefault(require("./routes/releaseRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const settingRoutes_1 = __importDefault(require("./routes/settingRoutes"));
const monitoringRoutes_1 = __importDefault(require("./routes/monitoringRoutes"));
const testRoutes_1 = __importDefault(require("./routes/testRoutes"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
const requestLogger_1 = require("./middlewares/requestLogger");
const timeoutHandler_1 = require("./middlewares/timeoutHandler");
const logger_1 = require("./utils/logger");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// Middleware
const allowedOrigins = env_1.config.allowedOrigins;
app.use((0, cors_1.default)({
    origin: allowedOrigins.includes('*') ? '*' : (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin))
            return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: !allowedOrigins.includes('*'),
}));
app.use(express_1.default.json({ limit: env_1.config.maxRequestSize }));
app.use((0, timeoutHandler_1.timeoutHandler)(25000)); // 25 second timeout for all requests
app.use(requestLogger_1.requestLogger); // Log all HTTP requests
// Health check endpoint
app.get('/health', (req, res) => {
    logger_1.logger.debug('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Compatibility alias for proxy/API-prefixed health checks
app.get('/api/health', (req, res) => {
    logger_1.logger.debug('API health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth routes (public)
app.use("/api/auth", authRoutes_1.default);
// API routes
app.use("/api/projects", authMiddleware_1.authenticate, projectRoutes_1.default);
app.use("/api/milestones", authMiddleware_1.authenticate, milestoneRoutes_1.default);
app.use("/api/activities", authMiddleware_1.authenticate, activityRoutes_1.default);
app.use("/api/releases", releaseRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/settings", settingRoutes_1.default);
app.use("/api/setting", settingRoutes_1.default);
app.use("/api/ai", authMiddleware_1.authenticate, aiRoutes_1.default);
// nested milestone routes under projects for frontend usage
app.use("/api/projects/:projectId/milestones", authMiddleware_1.authenticate, milestoneRoutes_1.default);
app.use("/api/projects/:projectId/activities", authMiddleware_1.authenticate, activityRoutes_1.default);
app.use("/api/projects/:projectId/releases", releaseRoutes_1.default);
app.use("/api/releases/:releaseId/activities", authMiddleware_1.authenticate, activityRoutes_1.default);
// Monitoring and testing routes
app.use("/api/monitoring", authMiddleware_1.authenticate, monitoringRoutes_1.default);
app.use("/api/tests", authMiddleware_1.authenticate, testRoutes_1.default);
const registerFallbackHandlers = () => {
    app.use((req, res) => {
        logger_1.logger.warn('Route not found', { method: req.method, path: req.path });
        res.status(404).json({ message: 'Route not found' });
    });
    app.use(errorHandler_1.default);
};
exports.registerFallbackHandlers = registerFallbackHandlers;
exports.default = app;
//# sourceMappingURL=app.js.map