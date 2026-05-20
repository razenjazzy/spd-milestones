import config from "../config/env";

type AiEntity = "activity" | "milestone" | "project";
type AiAction = "add" | "update" | "delete";

export type GeminiStructuredCommand = {
  entity: AiEntity;
  action: AiAction;
  projectId?: string;
  id?: string;
  fields?: Record<string, unknown>;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i) || raw.match(/```\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

export async function parsePromptWithGemini(params: {
  prompt: string;
  projectId?: string;
  model?: string;
}): Promise<GeminiStructuredCommand> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = params.model || config.geminiModel || "gemini-2.0-flash";
  const endpoint = `${config.geminiApiBase}/models/${model}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;

  const instruction = [
    "You are a strict command parser for SPD Milestones.",
    "Convert the user prompt into one JSON object only.",
    "Schema:",
    '{"entity":"activity|milestone|project","action":"add|update|delete","projectId":"optional","id":"optional","fields":{}}',
    "Rules:",
    "- For add activity: include fields.title and fields.date (yyyy-MM-dd) when possible.",
    "- For add milestone: include fields.title, fields.plannedStart, fields.plannedEnd.",
    "- For update/delete: include id if present in prompt.",
    "- Keep fields minimal, only inferred values.",
    "- If projectId is provided by system context and prompt does not override it, use it.",
    "- Output only valid JSON. No markdown.",
  ].join("\n");

  const userContent = [
    `fallbackProjectId: ${params.projectId || ""}`,
    `prompt: ${params.prompt}`,
  ].join("\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${instruction}\n\n${userContent}` }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as GeminiGenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
  const jsonText = extractJsonObject(text);

  let parsed: GeminiStructuredCommand;
  try {
    parsed = JSON.parse(jsonText) as GeminiStructuredCommand;
  } catch {
    throw new Error("Gemini response could not be parsed as JSON command.");
  }

  if (!parsed?.entity || !parsed?.action) {
    throw new Error("Gemini response missing required entity/action fields.");
  }

  if (!parsed.projectId && params.projectId) {
    parsed.projectId = params.projectId;
  }

  return parsed;
}
