import { Request, Response } from "express";
import { executeAiCommand } from "../services/aiCommandService";
import { logger } from "../utils/logger";

export const runCommand = async (req: Request, res: Response) => {
  try {
    const { prompt, projectId, command, provider, model } = req.body as {
      prompt?: string;
      projectId?: string;
      provider?: "local" | "gemini" | "gemini-cli";
      model?: string;
      command?: {
        entity: "activity" | "milestone" | "project";
        action: "add" | "update" | "delete";
        projectId?: string;
        id?: string;
        fields?: Record<string, unknown>;
      };
    };

    logger.info("AI command API request", {
      provider: provider || "local",
      hasPrompt: Boolean(prompt),
      hasCommand: Boolean(command),
      projectId: projectId || undefined,
    });

    const result = await executeAiCommand({ prompt, projectId, command, provider, model });

    logger.info("AI command API response", {
      providerUsed: (result as any)?.providerUsed || provider || "local",
      status: (result as any)?.status || "ok",
      hasResult: Boolean(result),
    });

    return res.json({ ok: true, result });
  } catch (err: any) {
    logger.error("AI command API failed", err, {
      provider: req.body?.provider || "local",
      hasPrompt: Boolean(req.body?.prompt),
      hasCommand: Boolean(req.body?.command),
    });
    return res.status(400).json({ ok: false, error: err.message || "Failed to execute AI command" });
  }
};
