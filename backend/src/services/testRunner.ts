import { logger } from '../utils/logger';
import * as projectService from '../services/projectService';
import * as milestoneService from '../services/milestoneService';
import * as monitoringService from '../services/monitoringService';
import * as activityService from '../services/activityService';
import * as releaseService from '../services/releaseService';
import * as settingService from '../services/settingService';
import { executeAiCommand } from '../services/aiCommandService';
import mongoose from 'mongoose';

/**
 * Test Runner
 * Runs comprehensive tests for all services and generates a report
 */

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

export interface TestReport {
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  /**
   * Run a single test
   */
  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const testStartTime = Date.now();
    try {
      logger.info(`Running test: ${name}`);
      await testFn();
      const duration = Date.now() - testStartTime;
      this.results.push({ name, passed: true, duration });
      logger.info(`✅ Test passed: ${name}`, { duration: `${duration}ms` });
    } catch (error) {
      const duration = Date.now() - testStartTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, duration, error: errorMessage });
      logger.error(`❌ Test failed: ${name}`, error as Error, { duration: `${duration}ms` });
    }
  }

  /**
   * Test: Create Project
   */
  private async testCreateProject(): Promise<void> {
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
  private async testGetProjects(): Promise<void> {
    const projects = await projectService.getProjects();
    
    if (!Array.isArray(projects)) {
      throw new Error('Projects should be an array');
    }
  }

  /**
   * Test: Update Project
   */
  private async testUpdateProject(): Promise<void> {
    // Create a project first
    const project = await projectService.createProject({
      name: 'Project to Update',
      description: 'Original description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (!project) throw new Error('Failed to create project');

    // Update it
    const updated = await projectService.updateProject(project._id.toString(), {
      description: 'Updated description',
    });

    if (!updated) throw new Error('Failed to update project');
    if (updated.description !== 'Updated description') {
      throw new Error('Project description was not updated');
    }
  }

  /**
   * Test: Create Milestone
   */
  private async testCreateMilestone(): Promise<void> {
    // Create a project first
    const project = await projectService.createProject({
      name: 'Project for Milestone',
      description: 'Test',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (!project) throw new Error('Failed to create project');

    const milestoneData = {
      title: 'Test Milestone',
      projectId: project._id.toString(),
      plannedStart: new Date(),
      plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending' as const,
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
  private async testGetMilestonesByProject(): Promise<void> {
    // Create a project and milestone
    const project = await projectService.createProject({
      name: 'Project for Milestones',
      description: 'Test',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (!project) throw new Error('Failed to create project');

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
  private async testUpdateMilestone(): Promise<void> {
    // Create project and milestone
    const project = await projectService.createProject({
      name: 'Project for Update',
      description: 'Test',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (!project) throw new Error('Failed to create project');

    const milestone = await milestoneService.createMilestone({
      title: 'Milestone to Update',
      projectId: project._id.toString(),
      plannedStart: new Date(),
      plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
    });

    if (!milestone) throw new Error('Failed to create milestone');

    // Update it
    const updated = await milestoneService.updateMilestone(milestone._id.toString(), {
      status: 'in-progress',
    });

    if (!updated) throw new Error('Failed to update milestone');
    if (updated.status !== 'in-progress') {
      throw new Error('Milestone status was not updated');
    }
  }

  /**
   * Test: Delete and Restore Milestone
   */
  private async testDeleteRestoreMilestone(): Promise<void> {
    // Create project and milestone
    const project = await projectService.createProject({
      name: 'Project for Delete',
      description: 'Test',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (!project) throw new Error('Failed to create project');

    const milestone = await milestoneService.createMilestone({
      title: 'Milestone to Delete',
      projectId: project._id.toString(),
      plannedStart: new Date(),
      plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
    });

    if (!milestone) throw new Error('Failed to create milestone');

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
  private async testProjectHealthMonitoring(): Promise<void> {
    // Create a project with overdue milestone
    const project = await projectService.createProject({
      name: 'Overdue Project',
      description: 'Test',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago (overdue)
    });

    if (!project) throw new Error('Failed to create project');

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
  private async testMonitoringReport(): Promise<void> {
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
  private async testActivityScopeSwitchToStandalone(): Promise<void> {
    const project = await projectService.createProject({
      name: 'Activity Scope Project',
      description: 'Test',
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    });

    if (!project) throw new Error('Failed to create project for activity scope test');

    const activity = await activityService.createActivity({
      title: 'Scoped Activity',
      date: new Date(),
      type: 'maintenance',
      scope: 'project',
      projectId: project._id as any,
    } as any);

    const updated = await activityService.updateActivity(activity._id.toString(), {
      scope: 'standalone',
    } as any);

    if (!updated) throw new Error('Failed to update activity to standalone');
    if (updated.scope !== 'standalone') throw new Error('Activity scope did not update to standalone');
    if ((updated as any).projectId) throw new Error('projectId should be cleared when scope becomes standalone');
    if ((updated as any).releaseId) throw new Error('releaseId should be cleared when scope becomes standalone');
  }

  /**
   * Test: Release artifact reveal supports shared settings key
   */
  private async testReleaseSharedKeyReveal(): Promise<void> {
    const release = await releaseService.createRelease({
      releasePackage: 'Shared Key Release',
      status: 'staging',
      type: 'application-glitch',
      downloadLink: 'https://example.org/pkg',
      downloadPassword: 'secret-pass',
    } as any);

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
  private async testAiMilestoneRequiresProject(): Promise<void> {
    let failed = false;

    try {
      await executeAiCommand({
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
    } catch (error: any) {
      failed = String(error?.message || '').includes('Referenced project does not exist');
    }

    if (!failed) throw new Error('AI milestone add should reject nonexistent project');
  }

  /**
   * Test: AI release-scoped activity requires existing release
   */
  private async testAiReleaseActivityRequiresRelease(): Promise<void> {
    let failed = false;

    try {
      await executeAiCommand({
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
    } catch (error: any) {
      failed = String(error?.message || '').includes('Referenced release does not exist');
    }

    if (!failed) throw new Error('AI release-scoped activity should reject nonexistent release');
  }

  /**
   * Test: Database Connection
   */
  private async testDatabaseConnection(): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database is not connected');
    }
  }

  /**
   * Test: Logger Functionality
   */
  private async testLogger(): Promise<void> {
    logger.debug('Test debug message');
    logger.info('Test info message');
    logger.warn('Test warning message');
    // Don't throw actual error, just test the method exists
    if (typeof logger.error !== 'function') {
      throw new Error('Logger error method not found');
    }
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<TestReport> {
    logger.info('🧪 Starting test suite');
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

    const report: TestReport = {
      timestamp: new Date(),
      totalTests: this.results.length,
      passedTests,
      failedTests,
      duration: totalDuration,
      results: this.results,
    };

    // Log summary
    logger.info('🧪 Test suite completed', {
      total: report.totalTests,
      passed: report.passedTests,
      failed: report.failedTests,
      duration: `${report.duration}ms`,
      successRate: `${((passedTests / report.totalTests) * 100).toFixed(1)}%`,
    });

    if (failedTests > 0) {
      logger.error('Some tests failed', undefined, {
        failedTests: this.results.filter(r => !r.passed).map(r => ({ name: r.name, error: r.error })),
      });
    }

    return report;
  }
}

// Export test runner
export const testRunner = new TestRunner();
