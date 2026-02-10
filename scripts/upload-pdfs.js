/* eslint-disable no-console */
/**
 * Script utilitário para (re)upload dos PDFs no Gemini File API e
 * regeneração do `src/data/resources.json`.
 *
 * Útil quando você troca a API key (os fileIds antigos podem dar 403).
 *
 * Uso:
 *   GOOGLE_AI_API_KEY=... node scripts/upload-pdfs.js
 */

const path = require("node:path");
const fs = require("node:fs/promises");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const { PLANOS_CURSO_CONFIG, METODOLOGIA_CONFIG } = require("../src/ai/pdf-config");

async function waitUntilActive(fm, fileId, { timeoutMs = 120000, intervalMs = 2000 } = {}) {
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const file = await fm.getFile(fileId);
    if (file?.state === "ACTIVE") return file;
    if (file?.state === "FAILED") throw new Error(`Arquivo falhou no processamento: ${fileId}`);
    if (Date.now() - started > timeoutMs) throw new Error(`Timeout aguardando ACTIVE: ${fileId} (state=${file?.state})`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function main() {
  const apiKey = (process.env.GOOGLE_AI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("Erro: defina GOOGLE_AI_API_KEY no ambiente.");
    process.exit(1);
  }

  const base = path.join(process.cwd(), "assets", "pdfs");
  const fm = new GoogleAIFileManager(apiKey);

  const resources = [];

  for (const plano of PLANOS_CURSO_CONFIG) {
    const localPath = path.join(base, plano.arquivo);
    console.log(`[upload] Plano: ${plano.nome}`);
    const uploaded = await fm.uploadFile(localPath, { mimeType: "application/pdf", displayName: plano.nome });
    await waitUntilActive(fm, uploaded.file.name);
    resources.push({
      name: plano.nome,
      fileId: uploaded.file.name,
      uri: uploaded.file.uri,
      mimeType: "application/pdf",
      source: "local",
      type: "plano_curso",
      keywords: plano.keywords || [],
    });
  }

  {
    const localPath = path.join(base, METODOLOGIA_CONFIG.arquivo);
    console.log(`[upload] Metodologia: ${METODOLOGIA_CONFIG.nome}`);
    const uploaded = await fm.uploadFile(localPath, { mimeType: "application/pdf", displayName: METODOLOGIA_CONFIG.nome });
    await waitUntilActive(fm, uploaded.file.name);
    resources.push({
      name: METODOLOGIA_CONFIG.nome,
      fileId: uploaded.file.name,
      uri: uploaded.file.uri,
      mimeType: "application/pdf",
      source: "local",
      type: "metodologia",
      keywords: METODOLOGIA_CONFIG.keywords || [],
    });
  }

  const outPath = path.join(process.cwd(), "src", "data", "resources.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify({ resources }, null, 2) + "\n", "utf-8");
  console.log(`[ok] Atualizado: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

