import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import config from "../config/env";
import { logger } from "../utils/logger";

type GeminiCliRunParams = {
  prompt: string;
  model?: string;
};

type GeminiCliRunResult = {
  ok: boolean;
  status: "cli-response";
  providerUsed: "gemini-cli";
  output: string;
  errorOutput?: string;
  command: string;
  cwd: string;
  exitCode: number;
  timedOut: boolean;
};

function splitArgs(input: string): string[] {
  const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return tokens.map((token) => token.replace(/^"|"$/g, ""));
}

function resolveCodebasePath(): string {
  const configured = (config.geminiCliCodebasePath || "").trim();
  return configured ? configured : process.cwd();
}

function resolveCliCommand(cwd: string): { command: string; args: string[] } {
  const explicit = (config.geminiCliCommand || "").trim();
  if (explicit) {
    const parts = splitArgs(explicit);
    return { command: parts[0] || "npx", args: parts.slice(1) };
  }

  const localDist = path.join(cwd, "gemini-cli", "packages", "cli", "dist", "index.js");
  if (fs.existsSync(localDist)) {
    return { command: "node", args: [localDist] };
  }

  return { command: "npx", args: ["--yes", "@google/gemini-cli"] };
}

export async function runGeminiCliPrompt(params: GeminiCliRunParams): Promise<GeminiCliRunResult> {
  const cwd = resolveCodebasePath();
  const { command, args } = resolveCliCommand(cwd);
  const runArgs = [...args, "--prompt", params.prompt, "--model", params.model || config.geminiModel];
  const timeoutMs = Math.max(5000, config.geminiCliTimeoutMs);

  logger.info("Gemini CLI execution starting", {
    cwd,
    command,
    model: params.model || config.geminiModel,
    timeoutMs,
  });

  return new Promise<GeminiCliRunResult>((resolve, reject) => {
    const child = spawn(command, runArgs, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GEMINI_API_KEY: config.geminiApiKey || process.env.GEMINI_API_KEY,
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
        if (!child.killed) child.kill("SIGKILL");
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
      logger.error("Gemini CLI process failed to start", err, {
        cwd,
        command,
      });
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (timedOut) {
        logger.warn("Gemini CLI execution timed out", {
          cwd,
          command,
          timeoutMs,
        });
      }
      logger.info("Gemini CLI execution completed", {
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
