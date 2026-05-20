"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const monitoringService_1 = require("../services/monitoringService");
const testRunner_1 = require("../services/testRunner");
const router = (0, express_1.Router)();
/**
 * GET /api/monitoring/report
 * Get comprehensive monitoring report
 */
router.get('/report', async (req, res) => {
    try {
        logger_1.logger.info('Generating monitoring report via API');
        const report = await (0, monitoringService_1.generateMonitoringReport)();
        res.json(report);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate monitoring report', error);
        res.status(500).json({ message: 'Failed to generate monitoring report', error });
    }
});
/**
 * GET /api/monitoring/project/:id
 * Get health status for specific project
 */
router.get('/project/:id', async (req, res) => {
    try {
        const { id } = req.params;
        logger_1.logger.info('Analyzing project health via API', { projectId: id });
        const health = await (0, monitoringService_1.analyzeProjectHealth)(id);
        res.json(health);
    }
    catch (error) {
        logger_1.logger.error('Failed to analyze project health', error);
        res.status(500).json({ message: 'Failed to analyze project health', error });
    }
});
/**
 * GET /api/monitoring/overdue
 * Get all overdue milestones
 */
router.get('/overdue', async (req, res) => {
    try {
        logger_1.logger.info('Fetching overdue milestones via API');
        const milestones = await (0, monitoringService_1.getOverdueMilestones)();
        res.json({ count: milestones.length, milestones });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch overdue milestones', error);
        res.status(500).json({ message: 'Failed to fetch overdue milestones', error });
    }
});
/**
 * GET /api/monitoring/stats
 * Get log statistics
 */
router.get('/stats', (req, res) => {
    try {
        const stats = logger_1.logger.getStats();
        res.json(stats || { message: 'Log file manager not enabled' });
    }
    catch (error) {
        logger_1.logger.error('Failed to get log stats', error);
        res.status(500).json({ message: 'Failed to get log stats', error });
    }
});
/**
 * POST /api/monitoring/test
 * Run test suite
 */
router.post('/test', async (req, res) => {
    try {
        logger_1.logger.info('Running test suite via API');
        const report = await testRunner_1.testRunner.runAll();
        res.json(report);
    }
    catch (error) {
        logger_1.logger.error('Failed to run test suite', error);
        res.status(500).json({ message: 'Failed to run test suite', error });
    }
});
exports.default = router;
//# sourceMappingURL=monitoringRoutes.js.map