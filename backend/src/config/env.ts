import dotenv from "dotenv";
dotenv.config();

interface EnvironmentConfig {
  // Server Configuration
  port: number;
  nodeEnv: string;
  
  // Database Configuration
  mongoUri: string;
  
  // CORS Configuration
  frontendUrl: string;
  allowedOrigins: string[];
  
  // Logging Configuration
  logToFile: boolean;
  logRetentionDays: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Monitoring Configuration
  monitoringIntervalMinutes: number;
  
  // GraphQL Configuration
  graphqlPath: string;
  graphqlPlayground: boolean;
  graphqlIntrospection: boolean;
  
  // API Configuration
  apiPrefix: string;
  requestTimeoutMs: number;
  maxRequestSize: string;

  // AI Configuration
  geminiApiKey: string;
  geminiModel: string;
  geminiApiBase: string;
  geminiFallbackToLocal: boolean;
  geminiCliCommand: string;
  geminiCliCodebasePath: string;
  geminiCliTimeoutMs: number;
  
  // Security Configuration
  corsEnabled: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  adminRegistrationKey: string;
  adminLinkRevalidationPassword: string;
}

const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? Number(value) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

export const config: EnvironmentConfig = {
  // Server Configuration
  port: getEnvNumber('PORT', 4000),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  
  // Database Configuration
  mongoUri: getEnv('MONGO_URI', 'mongodb://localhost:27017/spd'),
  
  // CORS Configuration
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  allowedOrigins: getEnv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,https://spd.milestones')
    .split(',')
    .map(origin => origin.trim()),
  
  // Logging Configuration
  logToFile: getEnvBoolean('LOG_TO_FILE', true),
  logRetentionDays: getEnvNumber('LOG_RETENTION_DAYS', 30),
  logLevel: getEnv('LOG_LEVEL', 'debug') as 'debug' | 'info' | 'warn' | 'error',
  
  // Monitoring Configuration
  monitoringIntervalMinutes: getEnvNumber('MONITORING_INTERVAL_MINUTES', 60),
  
  // GraphQL Configuration
  graphqlPath: getEnv('GRAPHQL_PATH', '/graphql'),
  graphqlPlayground: getEnvBoolean('GRAPHQL_PLAYGROUND', process.env.NODE_ENV !== 'production'),
  graphqlIntrospection: getEnvBoolean('GRAPHQL_INTROSPECTION', process.env.NODE_ENV !== 'production'),
  
  // API Configuration
  apiPrefix: getEnv('API_PREFIX', '/api'),
  requestTimeoutMs: getEnvNumber('REQUEST_TIMEOUT_MS', 30000),
  maxRequestSize: getEnv('MAX_REQUEST_SIZE', '10mb'),

  // AI Configuration
  geminiApiKey: getEnv('GEMINI_API_KEY', ''),
  geminiModel: getEnv('GEMINI_MODEL', 'gemini-2.0-flash-lite'),
  geminiApiBase: getEnv('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta'),
  geminiFallbackToLocal: getEnvBoolean('GEMINI_FALLBACK_TO_LOCAL', true),
  geminiCliCommand: getEnv('GEMINI_CLI_COMMAND', ''),
  geminiCliCodebasePath: getEnv('GEMINI_CLI_CODEBASE_PATH', ''),
  geminiCliTimeoutMs: getEnvNumber('GEMINI_CLI_TIMEOUT_MS', 45000),
  
  // Security Configuration
  corsEnabled: getEnvBoolean('CORS_ENABLED', true),
  rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  jwtSecret: getEnv('JWT_SECRET', ''),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  adminRegistrationKey: getEnv('ADMIN_REGISTRATION_KEY', ''),
  adminLinkRevalidationPassword: getEnv('ADMIN_LINK_REVALIDATION_PASSWORD', ''),
};

// Validation
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.mongoUri) {
    errors.push('MONGO_URI is required');
  }
  
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  
  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    errors.push('LOG_LEVEL must be debug, info, warn, or error');
  }
  
  if (config.logRetentionDays < 1 || config.logRetentionDays > 365) {
    errors.push('LOG_RETENTION_DAYS must be between 1 and 365');
  }
  
  if (config.monitoringIntervalMinutes < 1 || config.monitoringIntervalMinutes > 1440) {
    errors.push('MONITORING_INTERVAL_MINUTES must be between 1 and 1440');
  }

  if (isProduction() && !config.adminLinkRevalidationPassword) {
    errors.push('ADMIN_LINK_REVALIDATION_PASSWORD is required in production');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Helper functions
export const isDevelopment = (): boolean => config.nodeEnv === 'development';
export const isProduction = (): boolean => config.nodeEnv === 'production';
export const isTest = (): boolean => config.nodeEnv === 'test';

export default config;
