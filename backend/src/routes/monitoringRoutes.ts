import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { 
  generateMonitoringReport, 
  analyzeProjectHealth, 
  getOverdueMilestones 
} from '../services/monitoringService';
import { testRunner } from '../services/testRunner';

const router = Router();

/**
 * GET /api/monitoring/report
 * Get comprehensive monitoring report
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    logger.info('Generating monitoring report via API');
    const report = await generateMonitoringReport();
    res.json(report);
  } catch (error) {
    logger.error('Failed to generate monitoring report', error as Error);
    res.status(500).json({ message: 'Failed to generate monitoring report', error });
  }
});

/**
 * GET /api/monitoring/project/:id
 * Get health status for specific project
 */
router.get('/project/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Analyzing project health via API', { projectId: id });
    const health = await analyzeProjectHealth(id);
    res.json(health);
  } catch (error) {
    logger.error('Failed to analyze project health', error as Error);
    res.status(500).json({ message: 'Failed to analyze project health', error });
  }
});

/**
 * GET /api/monitoring/overdue
 * Get all overdue milestones
 */
router.get('/overdue', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching overdue milestones via API');
    const milestones = await getOverdueMilestones();
    res.json({ count: milestones.length, milestones });
  } catch (error) {
    logger.error('Failed to fetch overdue milestones', error as Error);
    res.status(500).json({ message: 'Failed to fetch overdue milestones', error });
  }
});

/**
 * GET /api/monitoring/stats
 * Get log statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = logger.getStats();
    res.json(stats || { message: 'Log file manager not enabled' });
  } catch (error) {
    logger.error('Failed to get log stats', error as Error);
    res.status(500).json({ message: 'Failed to get log stats', error });
  }
});

/**
 * POST /api/monitoring/test
 * Run test suite
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    logger.info('Running test suite via API');
    const report = await testRunner.runAll();
    res.json(report);
  } catch (error) {
    logger.error('Failed to run test suite', error as Error);
    res.status(500).json({ message: 'Failed to run test suite', error });
  }
});

export default router;
