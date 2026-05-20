/**
 * Application Settings
 * Centralized configuration for app-wide customizable values
 */

export const APP_SETTINGS = {
  // Application identity
  app: {
    name: 'SPD Milestones',
    version: '1.0.0',
    description: 'Project milestone tracking and Gantt chart visualization',
  },

  // Date and time formatting
  dateFormat: {
    display: 'dd-MMM-yyyy',
    input: 'yyyy-MM-dd',
    ganttHeader: 'dd-MMM',
    ganttDay: 'EEE',
  },

  // Gantt chart configuration
  gantt: {
    dayWidth: 55, // px per day
    rowHeight: 60, // px per row
    colors: {
      planned: '#6b7280',
      actual: '#10b981',
      delay: '#dc2626',
      todayLine: '#dc2626',
      saturday: '#fef2f2',
    },
    enableIterations: false, // Feature flag for iteration tracking
    showWeekends: true,
  },

  // Milestone configuration
  milestones: {
    defaultColor: '#6b8cff',
    statuses: {
      pending: 'pending',
      inProgress: 'in-progress',
      completed: 'completed',
      delayed: 'delayed',
    },
    statusColors: {
      pending: '#6b7280',
      'in-progress': '#f59e0b',
      completed: '#10b981',
      delayed: '#dc2626',
    },
  },

  // UI preferences
  ui: {
    theme: 'light', // 'light' | 'dark'
    sidebarWidth: 280,
    headerHeight: 64,
    cardBorderRadius: 8,
    enableAnimations: true,
  },

  // Feature flags
  features: {
    enableExport: true,
    enablePrint: true,
    enableFullscreen: true,
    enableDragDrop: false, // Not yet implemented
    enableNotifications: false, // Not yet implemented
    enableAuth: false, // Not yet implemented
  },

  // Pagination and limits
  limits: {
    projectsPerPage: 20,
    milestonesPerPage: 50,
    maxUploadSize: 5 * 1024 * 1024, // 5MB
  },

  // API configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
} as const;

// Type exports for TypeScript safety
export type AppSettings = typeof APP_SETTINGS;
export type MilestoneStatus = typeof APP_SETTINGS.milestones.statuses[keyof typeof APP_SETTINGS.milestones.statuses];
