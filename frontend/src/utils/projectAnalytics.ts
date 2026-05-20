// Analytics and Statistics Utilities
import { APP_CONFIG } from '../config/constants';

export interface ProjectAnalytics {
  totalProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  delayedMilestones: number;
  pendingMilestones: number;
  averageProjectCompletion: number;
  upcomingDeadlines: any[];
  criticalProjects: any[];
  recentActivity: any[];
  activeProjects: number;
  completedProjects: number;
  overdueMilestones: any[];
  averageProjectDuration: number;
}

export function calculateProjectAnalytics(projects: any[]): ProjectAnalytics {
  const allMilestones = projects.flatMap(p => p.milestones || []);
  
  const completed = allMilestones.filter(m => m.actualEnd);
  const inProgress = allMilestones.filter(m => m.actualStart && !m.actualEnd);
  const delayed = allMilestones.filter(m => m.delayDays > 0);
  const pending = allMilestones.filter(m => !m.actualStart && !m.actualEnd);

  // Calculate upcoming deadlines (next 7 days)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = allMilestones.filter(m => {
    const endDate = new Date(m.plannedEnd);
    return endDate >= now && endDate <= nextWeek && !m.actualEnd;
  });

  // Calculate critical projects (projects with delayed milestones)
  const criticalProjects = projects.filter(p => 
    (p.milestones || []).some((m: any) => m.delayDays > 0)
  );

  // Recent activity (milestones completed in last 7 days)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = allMilestones.filter(m => {
    const completedDate = m.actualEnd ? new Date(m.actualEnd) : null;
    return completedDate && completedDate >= lastWeek && completedDate <= now;
  });

  // Calculate active and completed projects
  const activeProjects = projects.filter(p => 
    (p.milestones || []).some((m: any) => m.actualStart && !m.actualEnd)
  ).length;

  const completedProjects = projects.filter(p => 
    (p.milestones || []).length > 0 && 
    (p.milestones || []).every((m: any) => m.actualEnd)
  ).length;

  // Overdue milestones (past planned end date but not completed)
  const overdueMilestones = allMilestones.filter(m => {
    const endDate = new Date(m.plannedEnd);
    return endDate < now && !m.actualEnd;
  });

  // Calculate average project duration
  const projectsWithDuration = projects.filter(p => {
    const milestones = p.milestones || [];
    return milestones.length > 0;
  }).map(p => {
    const milestones = p.milestones || [];
    const startDates = milestones.map((m: any) => new Date(m.plannedStart)).filter(Boolean);
    const endDates = milestones.map((m: any) => new Date(m.plannedEnd)).filter(Boolean);
    
    if (startDates.length > 0 && endDates.length > 0) {
      const projectStart = Math.min(...startDates.map((d: Date) => d.getTime()));
      const projectEnd = Math.max(...endDates.map((d: Date) => d.getTime()));
      return (projectEnd - projectStart) / (1000 * 60 * 60 * 24); // days
    }
    return 0;
  }).filter(duration => duration > 0);

  const averageProjectDuration = projectsWithDuration.length > 0
    ? projectsWithDuration.reduce((sum, duration) => sum + duration, 0) / projectsWithDuration.length
    : 0;

  return {
    totalProjects: projects.length,
    totalMilestones: allMilestones.length,
    completedMilestones: completed.length,
    inProgressMilestones: inProgress.length,
    delayedMilestones: delayed.length,
    pendingMilestones: pending.length,
    averageProjectCompletion: allMilestones.length > 0 
      ? Math.round((completed.length / allMilestones.length) * 100) 
      : 0,
    upcomingDeadlines: upcomingDeadlines.slice(0, 5), // Top 5
    criticalProjects: criticalProjects.slice(0, 3), // Top 3
    recentActivity: recentActivity.slice(0, 5), // Recent 5
    activeProjects,
    completedProjects,
    overdueMilestones: overdueMilestones.slice(0, 5), // Top 5
    averageProjectDuration,
  };
}

export interface ProjectFilters {
  search: string;
  status: 'all' | 'active' | 'completed' | 'critical';
  sortBy: 'name' | 'created' | 'deadline' | 'completion';
  sortOrder: 'asc' | 'desc';
}

export function filterAndSortProjects(projects: any[], filters: ProjectFilters): any[] {
  let filtered = [...projects];

  // Search filter
  if (filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      (project.milestones || []).some((m: any) => 
        m.title.toLowerCase().includes(searchLower)
      )
    );
  }

  // Status filter
  switch (filters.status) {
    case 'active':
      filtered = filtered.filter(p => 
        (p.milestones || []).some((m: any) => m.actualStart && !m.actualEnd)
      );
      break;
    case 'completed':
      filtered = filtered.filter(p => 
        (p.milestones || []).every((m: any) => m.actualEnd)
      );
      break;
    case 'critical':
      filtered = filtered.filter(p => 
        (p.milestones || []).some((m: any) => m.delayDays > 0)
      );
      break;
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'deadline':
        const aDeadline = Math.max(...(a.milestones || []).map((m: any) => new Date(m.plannedEnd).getTime()));
        const bDeadline = Math.max(...(b.milestones || []).map((m: any) => new Date(m.plannedEnd).getTime()));
        comparison = aDeadline - bDeadline;
        break;
      case 'completion':
        const aCompletion = (a.milestones || []).filter((m: any) => m.actualEnd).length / (a.milestones || []).length;
        const bCompletion = (b.milestones || []).filter((m: any) => m.actualEnd).length / (b.milestones || []).length;
        comparison = aCompletion - bCompletion;
        break;
    }

    return filters.sortOrder === 'desc' ? -comparison : comparison;
  });

  return filtered;
}