// Application Constants Configuration
export const APP_CONFIG = {
  // API Configuration
  api: {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Milestone Configuration
  milestones: {
    statuses: {
      PENDING: 'pending',
      IN_PROGRESS: 'in-progress', 
      COMPLETED: 'completed',
    },
    
    statusColors: {
      pending: '#b0b0b0',
      'in-progress': '#f59e0b',
      completed: '#10b981',
      delay: '#dc2626',
    },

    statusLabels: {
      pending: 'Pending',
      'in-progress': 'In Progress',
      completed: 'Completed',
    },

    predefinedColors: [
      '#2563eb', // Blue
      '#16a34a', // Green  
      '#dc2626', // Red
      '#f59e0b', // Orange
      '#7c3aed', // Purple
      '#0891b2', // Cyan
      '#e11d48', // Pink
      '#65a30d', // Lime
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
    ],

    defaultColor: '#2563eb',
  },

  // Project Configuration
  projects: {
    maxNameLength: 100,
    maxDescriptionLength: 500,
    defaultColor: '#2563eb',
  },

  // Gantt Chart Configuration
  gantt: {
    leftRailWidth: 220,
    headerHeight: 44,
    rowHeight: 40,
    cellMinWidth: 32,
    milestoneSize: 26,
    
    dateFormats: {
      display: 'MMM dd',
      day: 'EEE',
      input: 'yyyy-MM-dd',
    },

    colors: {
      planned: '#3b82f6',
      actual: '#10b981', 
      delay: '#dc2626',
      weekend: '#fef2f2',
      today: '#b0b0b0',
    },
  },

  // UI Configuration
  ui: {
    transitions: {
      fast: '0.15s ease',
      normal: '0.2s ease',
      slow: '0.3s ease',
    },

    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200,
    },

    zIndex: {
      dropdown: 1000,
      sticky: 1020,
      fixed: 1030,
      modalBackdrop: 1040,
      modal: 1050,
      popover: 1060,
      tooltip: 1070,
    },

    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },

    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: '50%',
    },
  },

  // Form Configuration
  forms: {
    validation: {
      minProjectNameLength: 3,
      maxProjectNameLength: 100,
      minMilestoneNameLength: 3,
      maxMilestoneNameLength: 100,
      maxTeamNameLength: 50,
    },

    debounceDelay: 300,
  },

  // Notification Configuration
  notifications: {
    duration: {
      success: 3000,
      info: 4000,
      warning: 5000,
      error: 6000,
    },
    
    position: {
      vertical: 'bottom',
      horizontal: 'right',
    },
  },

  // Date Configuration
  dates: {
    minDate: new Date('2020-01-01'),
    maxDate: new Date('2030-12-31'),
    defaultDuration: 7, // days
  },

  // Performance Configuration
  performance: {
    virtualScrollThreshold: 100,
    debounceSearchDelay: 300,
    lazyLoadOffset: 50,
  },
} as const;

// Type definitions for better TypeScript support
export type MilestoneStatus = typeof APP_CONFIG.milestones.statuses[keyof typeof APP_CONFIG.milestones.statuses];
export type StatusColor = keyof typeof APP_CONFIG.milestones.statusColors;
export type PredefinedColor = string; // Changed to string for flexibility

// Helper functions
export const getStatusColor = (status: MilestoneStatus): string => {
  return APP_CONFIG.milestones.statusColors[status] || APP_CONFIG.milestones.statusColors.pending;
};

export const getStatusLabel = (status: MilestoneStatus): string => {
  return APP_CONFIG.milestones.statusLabels[status] || 'Unknown';
};

export const isValidColor = (color: string): boolean => {
  return APP_CONFIG.milestones.predefinedColors.includes(color as any) || /^#[0-9A-F]{6}$/i.test(color);
};

export const formatDate = (date: Date | string, format: keyof typeof APP_CONFIG.gantt.dateFormats = 'display'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'display':
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    case 'day':
      return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    case 'input':
      return dateObj.toISOString().split('T')[0];
    default:
      return dateObj.toLocaleDateString();
  }
};

export default APP_CONFIG;