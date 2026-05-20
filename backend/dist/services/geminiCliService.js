"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGeminiCliPrompt = runGeminiCliPrompt;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = require("../utils/logger");
function splitArgs(input) {
    const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    return tokens.map((token) => token.replace(/^"|"$/g, ""));
}
function resolveCodebasePath() {
    const configured = (env_1.default.geminiCliCodebasePath || "").trim();
    return configured ? configured : process.cwd();
}
function resolveCliCommand(cwd) {
    const explicit = (env_1.default.geminiCliCommand || "").trim();
    if (explicit) {
        const parts = splitArgs(explicit);
        return { command: parts[0] || "npx", args: parts.slice(1) };
    }
    const localDist = node_path_1.default.join(cwd, "gemini-cli", "packages", "cli", "dist", "index.js");
    if (node_fs_1.default.existsSync(localDist)) {
        return { command: "node", args: [localDist] };
    }
    return { command: "npx", args: ["--yes", "@google/gemini-cli"] };
}
async function runGeminiCliPrompt(params) {
    const cwd = resolveCodebasePath();
    const { command, args } = resolveCliCommand(cwd);
    const runArgs = [...args, "--prompt", params.prompt, "--model", params.model || env_1.default.geminiModel];
    const timeoutMs = Math.max(5000, env_1.default.geminiCliTimeoutMs);
    logger_1.logger.info("Gemini CLI execution starting", {
        cwd,
        command,
        model: params.model || env_1.default.geminiModel,
        timeoutMs,
    });
    return new Promise((resolve, reject) => {
        const child = (0, node_child_process_1.spawn)(command, runArgs, {
            cwd,
            stdio: ["ignore", "pipe", "pipe"],
            env: {
                ...process.env,
                GEMINI_API_KEY: env_1.default.geminiApiKey || process.env.GEMINI_API_KEY,
                // Gemini CLI requires trusted workspace in non-interactive environments.
                GEMINI_CLI_TRUST_WORKSPACE: process.env.GEMINI_CLI_TRUST_WORKSPACE || "true",
                NO_COLOR: "1",
            },
        });
        let stdout = "";
        let stderr = "";
        let timedOut = false;
        const timeout = setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
            setTimeout(() => {
                if (!child.killed)
                    child.kill("SIGKILL");
            }, 1500);
        }, timeoutMs);
        child.stdout.on("data", (chunk) => {
            stdout += String(chunk);
        });
        child.stderr.on("data", (chunk) => {
            stderr += String(chunk);
        });
        child.on("error", (err) => {
            clearTimeout(timeout);
            logger_1.logger.error("Gemini CLI process failed to start", err, {
                cwd,
                command,
            });
            reject(err);
        });
        child.on("close", (code) => {
            clearTimeout(timeout);
            if (timedOut) {
                logger_1.logger.warn("Gemini CLI execution timed out", {
                    cwd,
                    command,
                    timeoutMs,
                });
            }
            logger_1.logger.info("Gemini CLI execution completed", {
                cwd,
                command,
                exitCode: typeof code === "number" ? code : -1,
                timedOut,
                stdoutChars: stdout.length,
                stderrChars: stderr.length,
            });
            resolve({
                ok: code === 0,
                status: "cli-response",
                providerUsed: "gemini-cli",
                output: stdout.trim(),
                errorOutput: stderr.trim() || undefined,
                command: [command, ...runArgs].join(" "),
                cwd,
                exitCode: typeof code === "number" ? code : -1,
                timedOut,
            });
        });
    });
}
//# sourceMappingURL=geminiCliService.js.map