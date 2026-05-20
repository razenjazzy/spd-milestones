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
exports.testRunner = void 0;
const logger_1 = require("../utils/logger");
const projectService = __importStar(require("../services/projectService"));
const milestoneService = __importStar(require("../services/milestoneService"));
const monitoringService = __importStar(require("../services/monitoringService"));
const activityService = __importStar(require("../services/activityService"));
const releaseService = __importStar(require("../services/releaseService"));
const settingService = __importStar(require("../services/settingService"));
const aiCommandService_1 = require("../services/aiCommandService");
const mongoose_1 = __importDefault(require("mongoose"));
class TestRunner {
    constructor() {
        this.results = [];
        this.startTime = 0;
    }
    /**
     * Run a single test
     */
    async runTest(name, testFn) {
        const testStartTime = Date.now();
        try {
            logger_1.logger.info(`Running test: ${name}`);
            await testFn();
            const duration = Date.now() - testStartTime;
            this.results.push({ name, passed: true, duration });
            logger_1.logger.info(`✅ Test passed: ${name}`, { duration: `${duration}ms` });
        }
        catch (error) {
            const duration = Date.now() - testStartTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.results.push({ name, passed: false, duration, error: errorMessage });
            logger_1.logger.error(`❌ Test failed: ${name}`, error, { duration: `${duration}ms` });
        }
    }
    /**
     * Test: Create Project
     */
    async testCreateProject() {
        const projectData = {
            name: 'Test Project',
            description: 'Test project description',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        };
        const project = await projectService.createProject(projectData);
        if (!project || !project._id) {
            throw new Error('Project creation failed');
        }
        if (project.name !== projectData.name) {
            throw new Error('Project name mismatch');
        }
    }
    /**
     * Test: Get All Projects
     */
    async testGetProjects() {
        const projects = await projectService.getProjects();
        if (!Array.isArray(projects)) {
            throw new Error('Projects should be an array');
        }
    }
    /**
     * Test: Update Project
     */
    async testUpdateProject() {
        // Create a project first
        const project = await projectService.createProject({
            name: 'Project to Update',
            description: 'Original description',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        if (!project)
            throw new Error('Failed to create project');
        // Update it
        const updated = await projectService.updateProject(project._id.toString(), {
            description: 'Updated description',
        });
        if (!updated)
            throw new Error('Failed to update project');
        if (updated.description !== 'Updated description') {
            throw new Error('Project description was not updated');
        }
    }
    /**
     * Test: Create Milestone
     */
    async testCreateMilestone() {
        // Create a project first
        const project = await projectService.createProject({
            name: 'Project for Milestone',
            description: 'Test',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        if (!project)
            throw new Error('Failed to create project');
        const milestoneData = {
            title: 'Test Milestone',
            projectId: project._id.toString(),
            plannedStart: new Date(),
            plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: 'pending',
        };
        const milestone = await milestoneService.createMilestone(milestoneData);
        if (!milestone || !milestone._id) {
            throw new Error('Milestone creation failed');
        }
        if (milestone.title !== milestoneData.title) {
            throw new Error('Milestone title mismatch');
        }
    }
    /**
     * Test: Get Milestones by Project
     */
    async testGetMilestonesByProject() {
        // Create a project and milestone
        const project = await projectService.createProject({
            name: 'Project for Milestones',
            description: 'Test',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        if (!project)
            throw new Error('Failed to create project');
        await milestoneService.createMilestone({
            title: 'Milestone 1',
            projectId: project._id.toString(),
            plannedStart: new Date(),
            plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
        });
        const milestones = await milestoneService.getMilestonesByProject(project._id.toString());
        if (!Array.isArray(milestones)) {
            throw new Error('Milestones should be an array');
        }
        if (milestones.length === 0) {
            throw new Error('Expected at least one milestone');
        }
    }
    /**
     * Test: Update Milestone
     */
    async testUpdateMilestone() {
        // Create project and milestone
        const project = await projectService.createProject({
            name: 'Project for Update',
            description: 'Test',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        if (!project)
            throw new Error('Failed to create project');
        const milestone = await milestoneService.createMilestone({
            title: 'Milestone to Update',
            projectId: project._id.toString(),
            plannedStart: new Date(),
            plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
        });
        if (!milestone)
            throw new Error('Failed to create milestone');
        // Update it
        const updated = await milestoneService.updateMilestone(milestone._id.toString(), {
            status: 'in-progress',
        });
        if (!updated)
            throw new Error('Failed to update milestone');
        if (updated.status !== 'in-progress') {
            throw new Error('Milestone status was not updated');
        }
    }
    /**
     * Test: Delete and Restore Milestone
     */
    async testDeleteRestoreMilestone() {
        // Create project and milestone
        const project = await projectService.createProject({
            name: 'Project for Delete',
            description: 'Test',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        if (!project)
            throw new Error('Failed to create project');
        const milestone = await milestoneService.createMilestone({
            title: 'Milestone to Delete',
            projectId: project._id.toString(),
            plannedStart: new Date(),
            plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
        });
        if (!milestone)
            throw new Error('Failed to create milestone');
        // Delete it
        const deleted = await milestoneService.deleteMilestone(milestone._id.toString());
        if (!deleted || !deleted.isDeleted) {
            throw new Error('Milestone was not deleted');
        }
        // Restore it
        const restored = await milestoneService.restoreMilestone(milestone._id.toString());
        if (!restored || restored.isDeleted) {
            throw new Error('Milestone was not restored');
        }
    }
    /**
     * Test: Project Health Monitoring
     */
    async testProjectHealthMonitoring() {
        // Create a project with overdue milestone
        const project = await projectService.createProject({
            name: 'Overdue Project',
            description: 'Test',
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago (overdue)
        });
        if (!project)
            throw new Error('Failed to create project');
        // Create overdue milestone
        await milestoneService.createMilestone({
            title: 'Overdue Milestone',
            projectId: project._id.toString(),
            plannedStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            plannedEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (overdue)
            status: 'pending',
        });
        const health = await monitoringService.analyzeProjectHealth(project._id.toString());
        if (health.status !== 'critical') {
            throw new Error('Expected project status to be critical');
        }
        if (health.overdueMilestones === 0) {
            throw new Error('Expected overdue milestones to be detected');
        }
    }
    /**
     * Test: Monitoring Report Generation
     */
    async testMonitoringReport() {
        const report = await monitoringService.generateMonitoringReport();
        if (!report || typeof report !== 'object') {
            throw new Error('Report should be an object');
        }
        if (!Array.isArray(report.projectDetails)) {
            throw new Error('Report should contain project details array');
        }
        if (typeof report.totalProjects !== 'number') {
            throw new Error('Report should contain total projects count');
        }
    }
    /**
     * Test: Activity can move from project/release scope to standalone
     */
    async testActivityScopeSwitchToStandalone() {
        const project = await projectService.createProject({
            name: 'Activity Scope Project',
            description: 'Test',
            startDate: new Date(),
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        });
        if (!project)
            throw new Error('Failed to create project for activity scope test');
        const activity = await activityService.createActivity({
            title: 'Scoped Activity',
            date: new Date(),
            type: 'maintenance',
            scope: 'project',
            projectId: project._id,
        });
        const updated = await activityService.updateActivity(activity._id.toString(), {
            scope: 'standalone',
        });
        if (!updated)
            throw new Error('Failed to update activity to standalone');
        if (updated.scope !== 'standalone')
            throw new Error('Activity scope did not update to standalone');
        if (updated.projectId)
            throw new Error('projectId should be cleared when scope becomes standalone');
        if (updated.releaseId)
            throw new Error('releaseId should be cleared when scope becomes standalone');
    }
    /**
     * Test: Release artifact reveal supports shared settings key
     */
    async testReleaseSharedKeyReveal() {
        const release = await releaseService.createRelease({
            releasePackage: 'Shared Key Release',
            status: 'staging',
            type: 'application-glitch',
            downloadLink: 'https://example.org/pkg',
            downloadPassword: 'secret-pass',
        });
        const sharedKey = 'test-shared-reveal-key';
        await settingService.updateSettings({ passwordRevealKey: sharedKey });
        const revealed = await releaseService.revealProtectedArtifact(release._id.toString(), sharedKey, 'downloadLink');
        if (!revealed || revealed === 'invalid-password') {
            throw new Error('Shared key was not accepted for artifact reveal');
        }
    }
    /**
     * Test: AI milestone add rejects missing project
     */
    async testAiMilestoneRequiresProject() {
        let failed = false;
        try {
            await (0, aiCommandService_1.executeAiCommand)({
                command: {
                    entity: 'milestone',
                    action: 'add',
                    projectId: '665f665f665f665f665f665f',
                    fields: {
                        title: 'AI Invalid Milestone',
                        plannedStart: '2026-05-01',
                        plannedEnd: '2026-05-03',
                    },
                },
            });
        }
        catch (error) {
            failed = String(error?.message || '').includes('Referenced project does not exist');
        }
        if (!failed)
            throw new Error('AI milestone add should reject nonexistent project');
    }
    /**
     * Test: AI release-scoped activity requires existing release
     */
    async testAiReleaseActivityRequiresRelease() {
        let failed = false;
        try {
            await (0, aiCommandService_1.executeAiCommand)({
                command: {
                    entity: 'activity',
                    action: 'add',
                    fields: {
                        title: 'AI Invalid Release Activity',
                        date: new Date(),
                        scope: 'release',
                        releaseId: '665f665f665f665f665f665f',
                        type: 'release',
                    },
                },
            });
        }
        catch (error) {
            failed = String(error?.message || '').includes('Referenced release does not exist');
        }
        if (!failed)
            throw new Error('AI release-scoped activity should reject nonexistent release');
    }
    /**
     * Test: Database Connection
     */
    async testDatabaseConnection() {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error('Database is not connected');
        }
    }
    /**
     * Test: Logger Functionality
     */
    async testLogger() {
        logger_1.logger.debug('Test debug message');
        logger_1.logger.info('Test info message');
        logger_1.logger.warn('Test warning message');
        // Don't throw actual error, just test the method exists
        if (typeof logger_1.logger.error !== 'function') {
            throw new Error('Logger error method not found');
        }
    }
    /**
     * Run all tests
     */
    async runAll() {
        logger_1.logger.info('🧪 Starting test suite');
        this.startTime = Date.now();
        this.results = [];
        // Run all tests
        await this.runTest('Database Connection', () => this.testDatabaseConnection());
        await this.runTest('Logger Functionality', () => this.testLogger());
        await this.runTest('Create Project', () => this.testCreateProject());
        await this.runTest('Get Projects', () => this.testGetProjects());
        await this.runTest('Update Project', () => this.testUpdateProject());
        await this.runTest('Create Milestone', () => this.testCreateMilestone());
        await this.runTest('Get Milestones by Project', () => this.testGetMilestonesByProject());
        await this.runTest('Update Milestone', () => this.testUpdateMilestone());
        await this.runTest('Delete and Restore Milestone', () => this.testDeleteRestoreMilestone());
        await this.runTest('Activity Scope Switch to Standalone', () => this.testActivityScopeSwitchToStandalone());
        await this.runTest('Release Shared Key Reveal', () => this.testReleaseSharedKeyReveal());
        await this.runTest('AI Milestone Requires Project', () => this.testAiMilestoneRequiresProject());
        await this.runTest('AI Release Activity Requires Release', () => this.testAiReleaseActivityRequiresRelease());
        await this.runTest('Project Health Monitoring', () => this.testProjectHealthMonitoring());
        await this.runTest('Monitoring Report Generation', () => this.testMonitoringReport());
        const totalDuration = Date.now() - this.startTime;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = this.results.filter(r => !r.passed).length;
        const report = {
            timestamp: new Date(),
            totalTests: this.results.length,
            passedTests,
            failedTests,
            duration: totalDuration,
            results: this.results,
        };
        // Log summary
        logger_1.logger.info('🧪 Test suite completed', {
            total: report.totalTests,
            passed: report.passedTests,
            failed: report.failedTests,
            duration: `${report.duration}ms`,
            successRate: `${((passedTests / report.totalTests) * 100).toFixed(1)}%`,
        });
        if (failedTests > 0) {
            logger_1.logger.error('Some tests failed', undefined, {
                failedTests: this.results.filter(r => !r.passed).map(r => ({ name: r.name, error: r.error })),
            });
        }
        return report;
    }
}
// Export test runner
exports.testRunner = new TestRunner();
//# sourceMappingURL=testRunner.js.map