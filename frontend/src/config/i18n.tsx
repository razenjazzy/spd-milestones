import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

/**
 * i18n implementation with English as default and only language
 * Language switcher available but only shows English
 */

interface Translations {
  [key: string]: string | Translations | any;
}

type Language = 'en';

// Language storage key
const LANGUAGE_STORAGE_KEY = 'spd_milestones_language';

// Get stored language or default to English
const getStoredLanguage = (): Language => {
  return 'en'; // Always English
};

// English translations (configurable)
const translationsEN: Translations = {
  app: {
    name: 'SPD Milestones',
  },
  nav: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    release: 'Release',
    ganttView: 'Gantt View',
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    cancel: 'Cancel',
    save: 'Save',
    update: 'Update',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    add: 'Add',
    restore: 'Restore',
    filter: 'Filter',
    sort: 'Sort',
    search: 'Search',
    actions: 'Actions',
    status: 'Status',
    complete: 'Complete',
    milestones: 'milestones',
    milestone: 'milestone',
    projects: 'projects',
    project: 'project',
    viewGantt: 'View Gantt',
    backTo: 'Back to',
    of: 'of',
  },
  dashboard: {
    title: 'Project Dashboard',
    subtitle: 'Manage your project milestones and timelines with ease',
    stats: {
      totalProjects: 'Total Projects',
      totalMilestones: 'Total Milestones',
      completionRate: 'Completion Rate',
      criticalProjects: 'Critical Projects',
    },
    empty: {
      title: 'No projects yet',
      description: 'Create your first project to start managing milestones and timelines. Use the form below to get started.',
      action: 'Create Project',
    },
    createProject: {
      title: 'Create New Project',
      subtitle: 'Start a new project to manage milestones and timelines',
      nameLabel: 'Project Name',
      namePlaceholder: 'e.g., Data Center Migration',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Brief project description',
      button: 'Create Project',
    },
    notifications: {
      nameRequired: 'Project name is required',
      created: 'Project created successfully',
      createError: 'Failed to create project',
      loadError: 'Failed to load projects',
    },
  },
  projects: {
    title: 'Projects',
    createProject: 'Create Project',
    header: {
      title: 'Projects',
      subtitle: 'Manage and track all your projects in one place',
      create: 'Create Project',
    },
    stats: {
      activeProjects: 'Active Projects',
      completedProjects: 'Completed Projects',
      overdueMilestones: 'Overdue Milestones',
      avgProjectDuration: 'Avg Project Duration',
    },
    filters: {
      searchPlaceholder: 'Search projects and milestones...',
      statusLabel: 'Status Filter',
      statusAll: 'All Projects',
      statusActive: 'Active',
      statusCompleted: 'Completed',
      statusCritical: 'Critical',
      sortBy: 'Sort by',
      resultsCount: 'of',
      projects: 'projects',
    },
    sort: {
      name: 'Name',
      created: 'Created Date',
      deadline: 'Deadline',
      completion: 'Completion',
    },
    sections: {
      upcomingDeadlines: 'Upcoming Deadlines',
      criticalProjects: 'Critical Projects',
      noUpcoming: 'No upcoming deadlines',
      noCritical: 'No critical projects',
    },
    dialog: {
      create: {
        title: 'Create New Project',
        nameLabel: 'Project Name',
        namePlaceholder: 'e.g., Data Center Migration',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Brief project description',
        cancel: 'Cancel',
        submit: 'Create Project',
      },
      edit: {
        title: 'Edit Project',
        cancel: 'Cancel',
        submit: 'Update',
      },
      delete: {
        title: 'Delete Project',
        message: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
        cancel: 'Cancel',
        submit: 'Delete',
      },
    },
    empty: {
      title: 'No Projects Found',
      messageFiltered: 'Try adjusting your search or filter criteria.',
      messageEmpty: 'Create your first project to start managing milestones and timelines.',
      createButton: 'Create New Project',
    },
    card: {
      milestones: 'milestones',
      complete: 'complete',
      edit: 'Edit',
      delete: 'Delete',
    },
    notifications: {
      created: 'Project created',
      updated: 'Project updated',
      deleted: 'Project deleted',
      createError: 'Failed to create project',
      updateError: 'Failed to update project',
      deleteError: 'Failed to delete project',
    },
  },
  gantt: {
    title: 'Gantt Chart',
    delayReason: 'Delay Reason',
    note: 'Note',
  },
  projectDetail: {
    loading: 'Loading...',
    addMilestone: {
      title: 'Add New Milestone',
      subtitle: 'Create a new milestone for this project',
      titleLabel: 'Title',
      titlePlaceholder: 'e.g., Environment Readiness',
      plannedStartLabel: 'Planned Start',
      plannedEndLabel: 'Planned End',
      responsibleLabel: 'Responsible',
      responsiblePlaceholder: 'Team member name',
      teamNameLabel: 'Team Name',
      teamNamePlaceholder: 'Team/Department name',
      colorLabel: 'Color',
      button: 'Add Milestone',
    },
    milestones: {
      title: 'Project Milestones',
      subtitle: 'Track and manage all milestones for this project',
      milestone: 'milestone',
      milestones: 'milestones',
      empty: {
        title: 'No milestones yet',
        description: 'Add your first milestone using the form above to get started.',
      },
      markComplete: 'Mark as Complete',
      workingDays: 'WD',
      delay: 'Delay',
      delayDays: 'd',
    },
    deleted: {
      title: 'Deleted Milestones',
      count: 'deleted',
      deletedOn: 'Deleted on',
      restore: 'Restore',
    },
    dialog: {
      complete: {
        title: 'Complete Milestone',
        actualStart: 'Actual Start',
        actualEnd: 'Actual End',
        cancel: 'Cancel',
        submit: 'Complete',
      },
      edit: {
        title: 'Edit Milestone',
        titleLabel: 'Title',
        plannedStart: 'Planned Start',
        plannedEnd: 'Planned End',
        responsible: 'Responsible',
        teamName: 'Team Name',
        color: 'Color',
        cancel: 'Cancel',
        submit: 'Update',
      },
      delete: {
        title: 'Delete Milestone',
        message: 'Are you sure you want to delete "{title}"? This milestone will be moved to the deleted section and can be restored later.',
        cancel: 'Cancel',
        submit: 'Delete',
      },
      restore: {
        title: 'Restore Milestone',
        message: 'Are you sure you want to restore "{title}"? This milestone will be moved back to the active milestones list.',
        cancel: 'Cancel',
        submit: 'Restore',
      },
      changeStatus: {
        title: 'Change Milestone Status',
        message: 'Change the status of "{title}":',
        pending: 'Pending (Not Started)',
        inProgress: 'In Progress',
        completed: 'Completed',
        cancel: 'Cancel',
      },
    },
    dialogs: {
      complete: {
        title: 'Complete Milestone',
        actualStart: 'Actual Start',
        actualEnd: 'Actual End',
        button: 'Complete',
      },
      edit: {
        title: 'Edit Milestone',
        titleLabel: 'Title',
        plannedStartLabel: 'Planned Start',
        plannedEndLabel: 'Planned End',
        responsibleLabel: 'Responsible',
        teamNameLabel: 'Team Name',
        colorLabel: 'Color',
        button: 'Update',
      },
      delete: {
        title: 'Delete Milestone',
        message: 'Are you sure you want to delete "{title}"? This milestone will be moved to the deleted section and can be restored later.',
        button: 'Delete',
      },
      restore: {
        title: 'Restore Milestone',
        message: 'Are you sure you want to restore "{title}"? This milestone will be moved back to the active milestones list.',
        button: 'Restore',
      },
      status: {
        title: 'Change Milestone Status',
        message: 'Change the status of "{title}":',
        pending: 'Pending (Not Started)',
        inProgress: 'In Progress',
        completed: 'Completed',
      },
    },
    menu: {
      edit: 'Edit',
      changeStatus: 'Change Status',
      delete: 'Delete',
    },
    notifications: {
      fillRequired: 'Please fill all required fields',
      added: 'Milestone added successfully',
      addError: 'Failed to add milestone',
      fillActualDates: 'Please fill actual start and end dates',
      completed: 'Milestone completed successfully',
      completeError: 'Failed to complete milestone',
      updated: 'Milestone updated successfully',
      updateError: 'Failed to update milestone',
      deleted: 'Milestone deleted successfully',
      deleteError: 'Failed to delete milestone',
      restored: 'Milestone restored successfully',
      restoreError: 'Failed to restore milestone',
      statusChanged: 'Milestone status changed to {status}',
      statusChangeError: 'Failed to change milestone status',
    },
  },
  ganttView: {
    title: 'Gantt Chart',
    stats: {
      totalMilestones: 'Total Milestones',
      onTime: 'On Time',
      delayed: 'Delayed',
      inProgress: 'In Progress',
    },
    timeline: {
      title: 'Timeline View',
      subtitle: 'Visual representation of project milestones and their progress',
    },
    filters: {
      filter: 'Filter',
      all: 'All Milestones',
      completed: 'Completed',
      delayed: 'Delayed',
      inProgress: 'In Progress',
      showCompleted: 'Show Completed',
      hideCompleted: 'Hide Completed',
      referenceDate: 'Reference Date',
      label: 'Filter',
      showCompletedLabel: 'Show Completed',
    },
    legend: {
      today: 'Today',
      workingDays: 'WD = Working Days',
      onTime: 'On Time',
      planned: 'Planned (Delayed)',
      delayed: 'Delay Extension',
    },
    actions: {
      export: 'Copy/download chart',
      print: 'Print chart',
      fullscreen: 'Toggle fullscreen',
    },
    notifications: {
      loadError: 'Failed to load project data',
      copied: 'Chart copied to clipboard',
      copyError: 'Failed to copy chart',
      exported: 'Chart exported successfully',
      exportError: 'Failed to export chart',
    },
  },
  globalGanttView: {
    title: 'Global Gantt Chart',
    selectProject: 'Select Project',
    noProjects: 'No projects available',
    actions: {
      export: 'Copy/download chart',
    },
    empty: {
      noMilestonesTitle: 'No milestones found',
      noMilestonesDesc: 'This project has no milestones yet.',
      goToProjects: 'Go to Projects',
      selectProjectTitle: 'Select a project to view Gantt chart',
      selectProjectDesc: 'You can go back to the dashboard to create or select a project from the dropdown.',
      goToDashboard: 'Go to Dashboard',
    },
  },
  tests: {
    title: 'Test Suite',
    subtitle: 'Run automated tests to verify system functionality',
    runButton: 'Run Tests',
    runningButton: 'Running...',
    summary: {
      total: 'Total Tests',
      passed: 'Passed',
      failed: 'Failed',
      successRate: 'Success Rate',
    },
    results: {
      title: 'Test Results',
      name: 'Test Name',
      status: 'Status',
      duration: 'Duration',
      passed: 'Passed',
      failed: 'Failed',
    },
    notifications: {
      runError: 'Failed to run tests',
      allPassed: 'All tests passed successfully!',
      someFailed: 'Some tests failed. Check results below.',
    },
  },
};

const allTranslations: Record<Language, Translations> = {
  en: translationsEN,
};

// Context type with language switcher support
// Updated to include language switcher functionality
type TranslationContextType = {
  t: (key: string) => string;  // Translation function using dot-notation paths
  translations: Translations;   // Raw translations object
  language: Language;           // Current language
  setLanguage: (lang: Language) => void;  // Change language function
  availableLanguages: { code: Language; name: string; nativeName: string }[];
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use stored language or default to English
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  // Persist language changes to localStorage
  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Function to get translation by dot-notation key path
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = allTranslations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if path not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const availableLanguages = [
    { code: 'en' as Language, name: 'English', nativeName: 'English' },
  ];

  const value = {
    t,
    translations: allTranslations[language],
    language,
    setLanguage,
    availableLanguages,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
};

export type { Language };