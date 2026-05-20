"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = void 0;
const aiCommandService_1 = require("../services/aiCommandService");
const logger_1 = require("../utils/logger");
const runCommand = async (req, res) => {
    try {
        const { prompt, projectId, command, provider, model } = req.body;
        logger_1.logger.info("AI command API request", {
            provider: provider || "local",
            hasPrompt: Boolean(prompt),
            hasCommand: Boolean(command),
            projectId: projectId || undefined,
        });
        const result = await (0, aiCommandService_1.executeAiCommand)({ prompt, projectId, command, provider, model });
        logger_1.logger.info("AI command API response", {
            providerUsed: result?.providerUsed || provider || "local",
            status: result?.status || "ok",
            hasResult: Boolean(result),
        });
        return res.json({ ok: true, result });
    }
    catch (err) {
        logger_1.logger.error("AI command API failed", err, {
            provider: req.body?.provider || "local",
            hasPrompt: Boolean(req.body?.prompt),
            hasCommand: Boolean(req.body?.command),
        });
        return res.status(400).json({ ok: false, error: err.message || "Failed to execute AI command" });
    }
};
exports.runCommand = runCommand;
//# sourceMappingURL=aiController.js.map