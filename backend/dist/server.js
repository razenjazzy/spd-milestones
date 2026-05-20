"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const app_1 = __importStar(require("./app"));
const logger_1 = require("./utils/logger");
const monitoringService_1 = require("./services/monitoringService");
const server_1 = require("./graphql/server");
const env_1 = require("./config/env");
dotenv_1.default.config();
const GRAPHQL_ONLY = process.env.GRAPHQL_ONLY === 'true';
const DISABLE_GRAPHQL = process.env.DISABLE_GRAPHQL === 'true';
const serviceType = GRAPHQL_ONLY ? 'GraphQL API Gateway' : DISABLE_GRAPHQL ? 'REST Microservice' : 'Full Stack API';
logger_1.logger.info(`Starting SPD Milestones ${serviceType}`, {
    port: env_1.config.port,
    environment: env_1.config.nodeEnv,
    mongoUri: env_1.config.mongoUri.replace(/\/\/.*:.*@/, '//*****:*****@'), // Hide credentials in logs
    monitoringInterval: `${env_1.config.monitoringIntervalMinutes} minutes`,
    graphqlPath: env_1.config.graphqlPath,
    mode: serviceType,
});
mongoose_1.default
    .connect(env_1.config.mongoUri)
    .then(async () => {
    logger_1.logger.info('MongoDB connected successfully', { uri: env_1.config.mongoUri.split('@')[1] || env_1.config.mongoUri });
    // Create HTTP server
    const httpServer = http_1.default.createServer(app_1.default);
    // Setup GraphQL only if not disabled
    if (!DISABLE_GRAPHQL) {
        await (0, server_1.setupGraphQL)(app_1.default, httpServer);
    }
    (0, app_1.registerFallbackHandlers)();
    httpServer.listen(env_1.config.port, () => {
        if (GRAPHQL_ONLY) {
            logger_1.logger.startup('SPD GraphQL API Gateway', env_1.config.port, {
                environment: env_1.config.nodeEnv,
                graphqlUrl: `http://localhost:${env_1.config.port}${env_1.config.graphqlPath}`,
                mode: 'GraphQL Only',
            });
        }
        else if (DISABLE_GRAPHQL) {
            logger_1.logger.startup('SPD REST Microservice', env_1.config.port, {
                environment: env_1.config.nodeEnv,
                apiUrl: `http://localhost:${env_1.config.port}`,
                mode: 'REST Only',
            });
        }
        else {
            logger_1.logger.startup('SPD Milestones API', env_1.config.port, {
                environment: env_1.config.nodeEnv,
                apiUrl: `http://localhost:${env_1.config.port}`,
                graphqlUrl: `http://localhost:${env_1.config.port}${env_1.config.graphqlPath}`,
            });
        }
        // Start project monitoring only in REST or full mode
        if (!GRAPHQL_ONLY) {
            (0, monitoringService_1.startMonitoring)(env_1.config.monitoringIntervalMinutes);
        }
    });
})
    .catch((err) => {
    logger_1.logger.error('MongoDB connection failed', err);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.shutdown('SPD Milestones API', 'SIGTERM received');
    mongoose_1.default.connection.close();
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.shutdown('SPD Milestones API', 'SIGINT received');
    mongoose_1.default.connection.close();
    process.exit(0);
});
//# sourceMappingURL=server.js.map