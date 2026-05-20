// Environment Configuration
interface EnvironmentConfig {
  API_BASE: string;
  GRAPHQL_URI: string;
  NODE_ENV: 'development' | 'production' | 'test';
  API_TIMEOUT: number;
  ENABLE_DEV_TOOLS: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  APP_NAME: string;
  APP_VERSION: string;
  FEATURE_FLAGS: {
    enableAdvancedGantt: boolean;
    enableNotifications: boolean;
    enableExport: boolean;
    enableRealTimeUpdates: boolean;
    enableGraphQL: boolean;
  };
}

// Default configuration
const defaultConfig: EnvironmentConfig = {
  API_BASE: 'http://localhost:4000/api',
  GRAPHQL_URI: 'http://localhost:4000/graphql',
  NODE_ENV: 'development',
  API_TIMEOUT: 30000,
  ENABLE_DEV_TOOLS: true,
  LOG_LEVEL: 'debug',
  APP_NAME: 'SPD Milestones',
  APP_VERSION: '1.0.0',
  FEATURE_FLAGS: {
    enableAdvancedGantt: true,
    enableNotifications: true,
    enableExport: false,
    enableRealTimeUpdates: false,
    enableGraphQL: false,
  },
};

// Environment-specific configurations
const environments: Record<string, Partial<EnvironmentConfig>> = {
  development: {
    API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:4000/api',
    GRAPHQL_URI: import.meta.env.VITE_GRAPHQL_URI || 'http://localhost:4000/graphql',
    NODE_ENV: 'development',
    ENABLE_DEV_TOOLS: true,
    LOG_LEVEL: 'debug',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'SPD Milestones',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    FEATURE_FLAGS: {
      enableAdvancedGantt: true,
      enableNotifications: true,
      enableExport: import.meta.env.VITE_ENABLE_EXPORT === 'true',
      enableRealTimeUpdates: import.meta.env.VITE_ENABLE_REALTIME === 'true',
      enableGraphQL: import.meta.env.VITE_ENABLE_GRAPHQL === 'true',
    },
  },
  
  production: {
    API_BASE: import.meta.env.VITE_API_BASE || 'https://api.spdmilestones.com',
    GRAPHQL_URI: import.meta.env.VITE_GRAPHQL_URI || 'https://api.spdmilestones.com/graphql',
    NODE_ENV: 'production',
    ENABLE_DEV_TOOLS: false,
    LOG_LEVEL: 'error',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'SPD Milestones',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    FEATURE_FLAGS: {
      enableAdvancedGantt: true,
      enableNotifications: true,
      enableExport: true,
      enableRealTimeUpdates: import.meta.env.VITE_ENABLE_REALTIME === 'true',
      enableGraphQL: import.meta.env.VITE_ENABLE_GRAPHQL === 'true',
    },
  },
  
  test: {
    API_BASE: 'http://localhost:4001/api',
    GRAPHQL_URI: 'http://localhost:4001/graphql',
    NODE_ENV: 'test',
    ENABLE_DEV_TOOLS: false,
    LOG_LEVEL: 'warn',
    APP_NAME: 'SPD Milestones Test',
    APP_VERSION: '1.0.0-test',
    FEATURE_FLAGS: {
      enableAdvancedGantt: false,
      enableNotifications: false,
      enableExport: false,
      enableRealTimeUpdates: false,
      enableGraphQL: false,
    },
  },
};

// Get current environment
const getCurrentEnv = (): string => {
  return import.meta.env.MODE || import.meta.env.NODE_ENV || 'development';
};

// Create final configuration
const createConfig = (): EnvironmentConfig => {
  const currentEnv = getCurrentEnv();
  const envConfig = environments[currentEnv] || {};
  
  return {
    ...defaultConfig,
    ...envConfig,
    // Override with specific environment variables
    API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || defaultConfig.API_TIMEOUT,
  };
};

// Export the configuration
export const ENV_CONFIG = createConfig();

// Type guards and utilities
export const isDevelopment = (): boolean => ENV_CONFIG.NODE_ENV === 'development';
export const isProduction = (): boolean => ENV_CONFIG.NODE_ENV === 'production';
export const isTest = (): boolean => ENV_CONFIG.NODE_ENV === 'test';

export const isFeatureEnabled = (feature: keyof EnvironmentConfig['FEATURE_FLAGS']): boolean => {
  return ENV_CONFIG.FEATURE_FLAGS[feature];
};

export const getApiUrl = (endpoint: string = ''): string => {
  const base = ENV_CONFIG.API_BASE;
  if (!endpoint) return base;
  return base.replace(/\/$/, '') + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
};

export const log = (level: EnvironmentConfig['LOG_LEVEL'], message: string, ...args: any[]): void => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(ENV_CONFIG.LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex >= currentLevelIndex) {
    console[level](message, ...args);
  }
};

// Environment validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!ENV_CONFIG.API_BASE) {
    errors.push('API_BASE is required');
  }
  
  if (!ENV_CONFIG.GRAPHQL_URI) {
    errors.push('GRAPHQL_URI is required');
  }
  
  if (!['development', 'production', 'test'].includes(ENV_CONFIG.NODE_ENV)) {
    errors.push('NODE_ENV must be development, production, or test');
  }
  
  if (ENV_CONFIG.API_TIMEOUT < 1000 || ENV_CONFIG.API_TIMEOUT > 60000) {
    errors.push('API_TIMEOUT must be between 1000 and 60000 milliseconds');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default ENV_CONFIG;