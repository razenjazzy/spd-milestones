import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import app, { registerFallbackHandlers } from "./app";
import { logger } from "./utils/logger";
import { startMonitoring } from "./services/monitoringService";
import { setupGraphQL } from "./graphql/server";
import { config } from "./config/env";

dotenv.config();

const GRAPHQL_ONLY = process.env.GRAPHQL_ONLY === 'true';
const DISABLE_GRAPHQL = process.env.DISABLE_GRAPHQL === 'true';

const serviceType = GRAPHQL_ONLY ? 'GraphQL API Gateway' : DISABLE_GRAPHQL ? 'REST Microservice' : 'Full Stack API';

logger.info(`Starting SPD Milestones ${serviceType}`, { 
  port: config.port, 
  environment: config.nodeEnv,
  mongoUri: config.mongoUri.replace(/\/\/.*:.*@/, '//*****:*****@'), // Hide credentials in logs
  monitoringInterval: `${config.monitoringIntervalMinutes} minutes`,
  graphqlPath: config.graphqlPath,
  mode: serviceType,
});

mongoose
  .connect(config.mongoUri)
  .then(async () => {
    logger.info('MongoDB connected successfully', { uri: config.mongoUri.split('@')[1] || config.mongoUri });
    
    // Create HTTP server
    const httpServer = http.createServer(app);
    
    // Setup GraphQL only if not disabled
    if (!DISABLE_GRAPHQL) {
      await setupGraphQL(app, httpServer);
    }

    registerFallbackHandlers();
    
    httpServer.listen(config.port, () => {
      if (GRAPHQL_ONLY) {
        logger.startup('SPD GraphQL API Gateway', config.port, {
          environment: config.nodeEnv,
          graphqlUrl: `http://localhost:${config.port}${config.graphqlPath}`,
          mode: 'GraphQL Only',
        });
      } else if (DISABLE_GRAPHQL) {
        logger.startup('SPD REST Microservice', config.port, {
          environment: config.nodeEnv,
          apiUrl: `http://localhost:${config.port}`,
          mode: 'REST Only',
        });
      } else {
        logger.startup('SPD Milestones API', config.port, {
          environment: config.nodeEnv,
          apiUrl: `http://localhost:${config.port}`,
          graphqlUrl: `http://localhost:${config.port}${config.graphqlPath}`,
        });
      }

      // Start project monitoring only in REST or full mode
      if (!GRAPHQL_ONLY) {
        startMonitoring(config.monitoringIntervalMinutes);
      }
    });
  })
  .catch((err: unknown) => {
    logger.error('MongoDB connection failed', err as Error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.shutdown('SPD Milestones API', 'SIGTERM received');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.shutdown('SPD Milestones API', 'SIGINT received');
  mongoose.connection.close();
  process.exit(0);
});