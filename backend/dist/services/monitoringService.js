"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProjectHealth = analyzeProjectHealth;
exports.generateMonitoringReport = generateMonitoringReport;
exports.getOverdueMilestones = getOverdueMilestones;
exports.startMonitoring = startMonitoring;
const Project_1 = __importDefault(require("../models/Project"));
const Milestone_1 = __importDefault(require("../models/Milestone"));
const logger_1 = require("../utils/logger");
/**
 * Check if a date is overdue
 */
function isOverdue(date) {
    if (!date)
        return false;
    return new Date(date) < new Date();
}
/**
 * Calculate days overdue
 */
function getDaysOverdue(date) {
    if (!date)
        return 0;
    const now = new Date();
    const diffTime = now.getTime() - new Date(date).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Analyze project health
 */
async function analyzeProjectHealth(projectId) {
    logger_1.logger.service('MonitoringService', 'Analyzing project health', { projectId });
    const project = await Project_1.default.findById(projectId);
    if (!project) {
        throw new Error(`Project not found: ${projectId}`);
    }
    const milestones = await Milestone_1.default.find({ projectId, isDeleted: { $ne: true } });
    const issues = [];
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
        }
        else if (isOverdue(milestone.plannedEnd)) {
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
    let status = 'healthy';
    if (overdueMilestones > 0 || isOverdue(project.endDate)) {
        status = 'critical';
    }
    else if (completionRate < 50 && milestones.length > 0) {
        status = 'warning';
    }
    const healthStatus = {
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
        logger_1.logger.warn('Critical project detected', healthStatus);
    }
    return healthStatus;
}
/**
 * Generate monitoring report for all projects
 */
async function generateMonitoringReport() {
    logger_1.logger.service('MonitoringService', 'Generating monitoring report');
    const projects = await Project_1.default.find();
    const projectDetails = [];
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
    const report = {
        timestamp: new Date(),
        totalProjects: projects.length,
        healthyProjects,
        warningProjects,
        criticalProjects,
        totalOverdueMilestones,
        projectDetails,
    };
    logger_1.logger.info('Monitoring report generated', {
        totalProjects: report.totalProjects,
        critical: report.criticalProjects,
        warning: report.warningProjects,
        healthy: report.healthyProjects,
    });
    // Log critical issues
    if (criticalProjects > 0) {
        logger_1.logger.error('Critical projects detected!', undefined, {
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
async function getOverdueMilestones() {
    logger_1.logger.service('MonitoringService', 'Fetching overdue milestones');
    const now = new Date();
    const overdueMilestones = await Milestone_1.default.find({
        plannedEnd: { $lt: now },
        status: { $ne: 'completed' },
        isDeleted: { $ne: true },
    }).populate('projectId');
    logger_1.logger.info('Overdue milestones fetched', { count: overdueMilestones.length });
    return overdueMilestones;
}
/**
 * Start monitoring scheduler (runs every hour)
 */
function startMonitoring(intervalMinutes = 60) {
    logger_1.logger.info('Starting project monitoring', { intervalMinutes });
    // Run immediately
    generateMonitoringReport().catch(err => {
        logger_1.logger.error('Failed to generate initial monitoring report', err);
    });
    // Schedule periodic monitoring
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(async () => {
        try {
            await generateMonitoringReport();
        }
        catch (error) {
            logger_1.logger.error('Failed to generate monitoring report', error);
        }
    }, intervalMs);
    logger_1.logger.info('Project monitoring scheduler started', {
        checkInterval: `${intervalMinutes} minutes`
    });
}
//# sourceMappingURL=monitoringService.js.map