"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testRunner_1 = require("../services/testRunner");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * Run all tests and return a comprehensive report
 */
router.post('/run', async (req, res) => {
    try {
        logger_1.logger.info('Test suite triggered via API');
        const report = await testRunner_1.testRunner.runAll();
        res.json({
            success: report.failedTests === 0,
            report,
            message: report.failedTests === 0
                ? `All ${report.totalTests} tests passed!`
                : `${report.failedTests} of ${report.totalTests} tests failed`,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to run test suite', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
/**
 * Get last test report (if available)
 */
router.get('/status', (req, res) => {
    res.json({
        message: 'Test endpoint is available',
        endpoint: '/api/tests/run',
        method: 'POST',
    });
});
exports.default = router;
//# sourceMappingURL=testRoutes.js.map