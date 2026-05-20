"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePromptWithGemini = parsePromptWithGemini;
const env_1 = __importDefault(require("../config/env"));
function extractJsonObject(raw) {
    const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i) || raw.match(/```\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1])
        return fenced[1].trim();
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first)
        return raw.slice(first, last + 1);
    return raw.trim();
}
async function parsePromptWithGemini(params) {
    if (!env_1.default.geminiApiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }
    const model = params.model || env_1.default.geminiModel || "gemini-2.0-flash";
    const endpoint = `${env_1.default.geminiApiBase}/models/${model}:generateContent?key=${encodeURIComponent(env_1.default.geminiApiKey)}`;
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
    const data = (await response.json());
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
    const jsonText = extractJsonObject(text);
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    }
    catch {
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
//# sourceMappingURL=geminiService.js.map