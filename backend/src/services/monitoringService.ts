import Project from '../models/Project';
import Milestone from '../models/Milestone';
import { logger } from '../utils/logger';

/**
 * Project Monitoring Service
 * Monitors projects and milestones for critical issues and overdue items
 */

export interface ProjectHealthStatus {
  projectId: string;
  projectName: string;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  overdueMilestones: number;
  totalMilestones: number;
  completionRate: number;
  daysOverdue?: number;
}

export interface MonitoringReport {
  timestamp: Date;
  totalProjects: number;
  healthyProjects: number;
  warningProjects: number;
  criticalProjects: number;
  totalOverdueMilestones: number;
  projectDetails: ProjectHealthStatus[];
}

/**
 * Check if a date is overdue
 */
function isOverdue(date: Date | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * Calculate days overdue
 */
function getDaysOverdue(date: Date | undefined): number {
  if (!date) return 0;
  const now = new Date();
  const diffTime = now.getTime() - new Date(date).getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Analyze project health
 */
export async function analyzeProjectHealth(projectId: string): Promise<ProjectHealthStatus> {
  logger.service('MonitoringService', 'Analyzing project health', { projectId });

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const milestones = await Milestone.find({ projectId, isDeleted: { $ne: true } });
  
  const issues: string[] = [];
  let overdueMilestones = 0;
  let completedMilestones = 0;

  // Check project end date
  if (isOverdue(project.endDate)) {
    const daysOverdue = getDaysOverdue(project.endDate);
    issues.push(`Project is ${daysOverdue} days overdue`);
  }

  // Check milestones
  milestones.forEach(milestone => {
    if (milestone.status === 'completed') {
      completedMilestones++;
    } else if (isOverdue(milestone.plannedEnd)) {
      overdueMilestones++;
    }
  });

  if (overdueMilestones > 0) {
    issues.push(`${overdueMilestones} milestones are overdue`);
  }

  const completionRate = milestones.length > 0 
    ? (completedMilestones / milestones.length) * 100 
    : 0;

  // Determine status
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (overdueMilestones > 0 || isOverdue(project.endDate)) {
    status = 'critical';
  } else if (completionRate < 50 && milestones.length > 0) {
    status = 'warning';
  }

  const healthStatus: ProjectHealthStatus = {
    projectId: project._id.toString(),
    projectName: project.name,
    status,
    issues,
    overdueMilestones,
    totalMilestones: milestones.length,
    completionRate: Math.round(completionRate),
    daysOverdue: isOverdue(project.endDate) ? getDaysOverdue(project.endDate) : undefined,
  };

  if (status === 'critical') {
    logger.warn('Critical project detected', healthStatus);
  }

  return healthStatus;
}

/**
 * Generate monitoring report for all projects
 */
export async function generateMonitoringReport(): Promise<MonitoringReport> {
  logger.service('MonitoringService', 'Generating monitoring report');

  const projects = await Project.find();
  const projectDetails: ProjectHealthStatus[] = [];
  
  let healthyProjects = 0;
  let warningProjects = 0;
  let criticalProjects = 0;
  let totalOverdueMilestones = 0;

  for (const project of projects) {
    const health = await analyzeProjectHealth(project._id.toString());
    projectDetails.push(health);

    switch (health.status) {
      case 'healthy':
        healthyProjects++;
        break;
      case 'warning':
        warningProjects++;
        break;
      case 'critical':
        criticalProjects++;
        break;
    }

    totalOverdueMilestones += health.overdueMilestones;
  }

  const report: MonitoringReport = {
    timestamp: new Date(),
    totalProjects: projects.length,
    healthyProjects,
    warningProjects,
    criticalProjects,
    totalOverdueMilestones,
    projectDetails,
  };

  logger.info('Monitoring report generated', {
    totalProjects: report.totalProjects,
    critical: report.criticalProjects,
    warning: report.warningProjects,
    healthy: report.healthyProjects,
  });

  // Log critical issues
  if (criticalProjects > 0) {
    logger.error('Critical projects detected!', undefined, {
      count: criticalProjects,
      projects: projectDetails
        .filter(p => p.status === 'critical')
        .map(p => ({ name: p.projectName, issues: p.issues })),
    });
  }

  return report;
}

/**
 * Get overdue milestones across all projects
 */
export async function getOverdueMilestones() {
  logger.service('MonitoringService', 'Fetching overdue milestones');

  const now = new Date();
  const overdueMilestones = await Milestone.find({
    plannedEnd: { $lt: now },
    status: { $ne: 'completed' },
    isDeleted: { $ne: true },
  }).populate('projectId');

  logger.info('Overdue milestones fetched', { count: overdueMilestones.length });

  return overdueMilestones;
}

/**
 * Start monitoring scheduler (runs every hour)
 */
export function startMonitoring(intervalMinutes: number = 60) {
  logger.info('Starting project monitoring', { intervalMinutes });

  // Run immediately
  generateMonitoringReport().catch(err => {
    logger.error('Failed to generate initial monitoring report', err);
  });

  // Schedule periodic monitoring
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(async () => {
    try {
      await generateMonitoringReport();
    } catch (error) {
      logger.error('Failed to generate monitoring report', error as Error);
    }
  }, intervalMs);

  logger.info('Project monitoring scheduler started', { 
    checkInterval: `${intervalMinutes} minutes` 
  });
}
