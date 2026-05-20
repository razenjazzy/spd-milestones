import { Router, Request, Response } from 'express';
import { testRunner } from '../services/testRunner';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Run all tests and return a comprehensive report
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    logger.info('Test suite triggered via API');
    const report = await testRunner.runAll();
    
    res.json({
      success: report.failedTests === 0,
      report,
      message: report.failedTests === 0
        ? `All ${report.totalTests} tests passed!`
        : `${report.failedTests} of ${report.totalTests} tests failed`,
    });
  } catch (error: any) {
    logger.error('Failed to run test suite', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get last test report (if available)
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    message: 'Test endpoint is available',
    endpoint: '/api/tests/run',
    method: 'POST',
  });
});

export default router;
