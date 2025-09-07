export const env = {
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY ?? "",
  AI_GEMINI_ENABLED: (process.env.AI_GEMINI_ENABLED ?? "false") === "true",
  AI_MODEL_NAME: process.env.AI_MODEL_NAME ?? "gemini-2.5-flash",
  AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS ?? 60000),
  AI_MAX_OUTPUT_TOKENS: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 8192),
  AI_CACHE_ENABLED: (process.env.AI_CACHE_ENABLED ?? "true") === "true",
};

if (!env.GOOGLE_AI_API_KEY) {
  console.warn("[AI] GOOGLE_AI_API_KEY ausente – defina no ambiente.");
}
