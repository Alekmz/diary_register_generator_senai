export const env = {
  GOOGLE_AI_API_KEY: (process.env.GOOGLE_AI_API_KEY ?? "").trim(),
  AI_GEMINI_ENABLED: (process.env.AI_GEMINI_ENABLED ?? "false") === "true",
  // Observação: evite espaços no final (ex.: "gemini-2.5-flash ")
  AI_MODEL_NAME: (process.env.AI_MODEL_NAME ?? "gemini-2.5-flash").trim(),
  AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS ?? 60000),
  AI_MAX_OUTPUT_TOKENS: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 32768),
  AI_CACHE_ENABLED: (process.env.AI_CACHE_ENABLED ?? "true") === "true",
  // Se habilitado, tenta uma "segunda passada" com modelo mais forte
  // quando detectar capacidades truncadas (quebra de página/linha).
  AI_REPAIR_TRUNCATION_ENABLED: (process.env.AI_REPAIR_TRUNCATION_ENABLED ?? "true") === "true",
};

if (!env.GOOGLE_AI_API_KEY) {
  console.warn("[AI] GOOGLE_AI_API_KEY ausente – defina no ambiente.");
}
