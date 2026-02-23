import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  ensurePdfUploaded, 
  findPlanoCursoByKeywords, 
  getMetodologiaResource,
  getAllResources,
  clearResourcesCache,
  getStorageInfo
} from "./files";
import { SYSTEM_INSTRUCTION } from "./prompt";
import { PLANOS_CURSO_CONFIG, METODOLOGIA_CONFIG } from "./pdf-config";
import { OutputSchema, OutputDTO, FormInput } from "./types";
import { env } from "../config/env";
import path from "node:path";
import crypto from "crypto";

// Cache simples em memória para reduzir chamadas ao Gemini
const responseCache = new Map<string, { response: OutputDTO; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para detectar erros 403 relacionados a arquivos
function isFilePermissionError(error: any): boolean {
  const message = error?.message || '';
  return (
    message.includes('403') || 
    message.includes('Forbidden') ||
    message.includes('permission') ||
    message.includes('access') ||
    message.includes('not exist') ||
    message.includes('File') && (message.includes('403') || message.includes('Forbidden'))
  );
}

function tryRepairTruncatedJson(s: string): string | null {
  let repaired = s;
  
  // Close any unterminated string
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }
  
  // Count open brackets/braces and close them
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (ch === '\\' && inString) { i++; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  // Remove trailing comma before closing
  repaired = repaired.replace(/,\s*$/, '');

  for (let i = 0; i < openBrackets; i++) repaired += ']';
  for (let i = 0; i < openBraces; i++) repaired += '}';
  
  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    return null;
  }
}

function tryParseJsonStrict(s: string): OutputDTO {
  let cleaned = s.trim();
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  const m = cleaned.match(/\{[\s\S]*\}$/);
  const raw = m ? m[0] : cleaned;
  
  try {
    const obj = JSON.parse(raw);
    return OutputSchema.parse(obj);
  } catch (firstError) {
    // Attempt to repair truncated JSON before giving up
    const repaired = tryRepairTruncatedJson(cleaned);
    if (repaired) {
      try {
        const obj = JSON.parse(repaired);
        console.warn('[AI] JSON truncado reparado com sucesso (resposta pode estar incompleta)');
        const result = OutputSchema.safeParse(obj);
        if (result.success) {
          result.data.observacoes ??= [];
          result.data.observacoes.push("Resposta da IA foi truncada e reparada automaticamente. Alguns dados podem estar incompletos.");
          return result.data;
        }
      } catch { /* repair failed, fall through */ }
    }

    console.error('[AI] Erro ao parsear JSON:', firstError);
    console.error('[AI] Primeiros 500 chars:', s.slice(0, 500));
    
    const isTruncation = firstError instanceof Error && 
      (firstError.message.includes('Unterminated') || firstError.message.includes('Unexpected end'));
    
    throw new Error(
      isTruncation 
        ? `JSON_TRUNCATED: Resposta da IA foi cortada (posição ${s.length} chars). Tente novamente.`
        : `Falha ao parsear resposta JSON: ${firstError instanceof Error ? firstError.message : 'Erro desconhecido'}`
    );
  }
}

// Idempotência de upload (executar uma vez no boot ou sob demanda)
export async function ensureBasePdfsUploaded() {
  const base = path.join(process.cwd(), "assets", "pdfs");
  
  // Upload dos planos de curso usando configuração centralizada
  for (const plano of PLANOS_CURSO_CONFIG) {
    await ensurePdfUploaded(
      plano.nome,
      path.join(base, plano.arquivo),
      "plano_curso",
      plano.keywords
    );
  }
  
  // Upload do arquivo de metodologia
  await ensurePdfUploaded(
    METODOLOGIA_CONFIG.nome,
    path.join(base, METODOLOGIA_CONFIG.arquivo),
    "metodologia",
    METODOLOGIA_CONFIG.keywords
  );
}

function isQuotaZero(err: any): boolean {
  const msg = err?.message || '';
  return msg.includes('limit: 0') || msg.includes('quota') && msg.includes('limit: 0');
}

async function withRetries<T>(fn: () => Promise<T>, tries=2, baseMs=2000): Promise<T> {
  let lastErr: any;
  for (let i=0; i<tries; i++) {
    try { 
      return await fn(); 
    }
    catch (err: any) {
      lastErr = err;
      
      // Quota = 0 means the model isn't available on this tier at all — no point retrying
      if (isQuotaZero(err)) {
        console.log(`[AI] Quota zero para este modelo (indisponível no free tier). Pulando retries.`);
        break;
      }
      
      const isRateLimit = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate');
      
      if (isRateLimit) {
        const retryDelay = Math.min(30000, baseMs * Math.pow(2, i));
        console.log(`[AI] Rate limit atingido. Tentativa ${i + 1}/${tries}. Aguardando ${retryDelay}ms...`);
        if (i < tries - 1) {
          await new Promise(r => setTimeout(r, retryDelay));
        }
      } else {
        if (i < tries - 1) {
          await new Promise(r => setTimeout(r, baseMs * Math.pow(2, i)));
        }
      }
    }
  }
  throw lastErr;
}

// Lista de modelos para fallback em caso de rate limit.
// Apenas modelos disponíveis no free tier. Ordem prioriza velocidade.
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

export async function generateFromGemini(userPrompt: string, planoCurso: string): Promise<OutputDTO> {
  if (!env.AI_GEMINI_ENABLED) {
    // fallback: monta DTO com dados do formulário e marca capacidades como "não localizado..."
    throw new Error("AI desabilitado; habilite AI_GEMINI_ENABLED para geração.");
  }

  // Verificar tipo de armazenamento
  const storageInfo = await getStorageInfo();
  console.log(`[AI] Usando armazenamento: ${storageInfo.type} (read-only: ${storageInfo.isReadOnly})`);

  // Gerar chave de cache baseada no prompt e plano de curso
  const cacheKey = crypto
    .createHash('md5')
    .update(`${userPrompt}-${planoCurso}`)
    .digest('hex');

  // Verificar cache (se habilitado)
  if (env.AI_CACHE_ENABLED) {
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('[AI] Resposta encontrada no cache');
      return cached.response;
    }
  }

  // Tentar até 2 vezes: primeira tentativa normal, segunda com limpeza de cache
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[AI] Tentativa ${attempt}/2 - Iniciando upload de PDFs...`);
      await ensureBasePdfsUploaded();
      
      // Buscar os recursos específicos
      console.log(`[AI] Buscando plano de curso: "${planoCurso}"`);
      const planoCursoResource = await findPlanoCursoByKeywords(planoCurso);
      const metodologiaResource = await getMetodologiaResource();
      
      console.log(`[AI] Plano de curso encontrado: ${planoCursoResource?.fileId}`);
      console.log(`[AI] Metodologia encontrada: ${metodologiaResource?.fileId}`);
      
      if (!planoCursoResource) {
        throw new Error(`Plano de curso "${planoCurso}" não encontrado nos arquivos disponíveis.`);
      }
      
      if (!metodologiaResource) {
        throw new Error("Arquivo de metodologia não encontrado.");
      }

      // Tentar gerar com os recursos encontrados
      return await attemptGeneration(userPrompt, planoCursoResource, metodologiaResource, cacheKey);
      
    } catch (error: any) {
      console.log(`[AI] Erro na tentativa ${attempt}:`, error.message);
      
      // Se é erro de permissão de arquivo e ainda temos tentativas
      if (isFilePermissionError(error) && attempt === 1) {
        console.log('[AI] Detectado erro 403 relacionado a arquivos. Limpando cache e tentando novamente...');
        await clearResourcesCache();
        // Limpar também o cache de respostas para evitar usar dados corrompidos
        responseCache.clear();
        continue; // Tentar novamente
      }
      
      // Se não é erro de arquivo ou já tentamos 2 vezes, relançar o erro
      throw error;
    }
  }
  
  throw new Error("Todas as tentativas falharam");
}

// Função separada para tentar a geração com os recursos já carregados
async function attemptGeneration(
  userPrompt: string, 
  planoCursoResource: any, 
  metodologiaResource: any, 
  cacheKey: string
): Promise<OutputDTO> {
  // Tentar diferentes modelos (env primeiro) e fallback em caso de rate limit
  let lastError: any;
  
  const modelsToTry = Array.from(new Set([env.AI_MODEL_NAME, ...FALLBACK_MODELS].filter(Boolean)));
  const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);

  const buildParts = (promptText: string) => ([
    {
      fileData: { 
        fileUri: planoCursoResource.uri, 
        mimeType: planoCursoResource.mimeType 
      }
    },
    {
      fileData: { 
        fileUri: metodologiaResource.uri, 
        mimeType: metodologiaResource.mimeType 
      }
    },
    { text: promptText }
  ]);

  const callOnce = async (modelName: string, promptText: string) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: { 
        role: "system",
        parts: [{ text: SYSTEM_INSTRUCTION }] 
      },
      generationConfig: {
        maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
        temperature: 0.0,
        // Ajuda o modelo a manter JSON válido e reduz "ruído"
        responseMimeType: "application/json",
      },
    });

    const parts = buildParts(promptText);
    console.log(`[AI] Enviando request com ${parts.length} parts`);
    console.log(`[AI] PDF 1 URI: ${planoCursoResource.uri}`);
    console.log(`[AI] PDF 2 URI: ${metodologiaResource.uri}`);

    const res = await model.generateContent({ contents: [{ role: "user", parts }] });
    const text = res.response.text();
    return text?.trim() ?? "";
  };

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Tentando modelo: ${modelName}`);

      const result = await withRetries(async () => {
        return await callOnce(modelName, userPrompt);
      });

      if (result) {
        console.log(`[AI] Sucesso com modelo: ${modelName}`);
        
        // Parsear JSON
        const dto = tryParseJsonStrict(result);
        
        // Normalizações leves
        dto.observacoes ??= [];

        // Micro-checagem para detectar truncamentos
        const provávelTruncamento = (s: string) => {
          const t = s.trim().toLowerCase();
          // termina sem pontuação ou com preposições comuns
          const terminaComPreposicao = /( por meio| por| para| com| de| em| através de| via)$/i.test(t);
          const semPontuacaoFinal = !/[.!?…]$/.test(t);
          // muito curto pode ser bullet quebrado também, mas vamos ser conservadores
          return terminaComPreposicao || semPontuacaoFinal;
        };

        if (Array.isArray(dto.capacidadesUC_todas)) {
          const suspeitas = dto.capacidadesUC_todas.filter(provávelTruncamento);
          if (suspeitas.length > 0) {
            dto.observacoes.push(
              "Uma ou mais capacidades parecem truncadas (ex.: terminam com preposição ou sem pontuação). Verifique se o PDF possui quebra de página/linha nessa seção."
            );

            // Tentativa extra para melhorar quebras de página/linha:
            // Se detectarmos itens truncados, tentar uma segunda passada com modelo mais forte.
            if (env.AI_REPAIR_TRUNCATION_ENABLED) {
              const repairModels = ["gemini-2.5-flash", "gemini-2.0-flash"].filter(m => m !== modelName);
              for (const repairModel of repairModels) {
                try {
                  console.log(`[AI] Tentando reparo de truncamento com: ${repairModel}`);
                  const repairPrompt =
                    `${userPrompt}\n\n` +
                    `REPARO (OBRIGATÓRIO): Na tentativa anterior, algumas capacidades aparentaram estar truncadas por quebras de página/linha.\n` +
                    `Re-faça a EXTRAÇÃO de "capacidadesUC_todas" e "capacidadesUC_selecionadas" garantindo que cada item esteja COMPLETO.\n` +
                    `Itens suspeitos (não confie neles; use apenas como pista):\n` +
                    suspeitas.map(s => `- ${s}`).join("\n") +
                    `\n\nResponda APENAS com o JSON no schema exigido.`;

                  const repairedRaw = await withRetries(async () => callOnce(repairModel, repairPrompt), 3, 1500);
                  const repaired = tryParseJsonStrict(repairedRaw);

                  const repairedSuspeitas = Array.isArray(repaired.capacidadesUC_todas)
                    ? repaired.capacidadesUC_todas.filter(provávelTruncamento)
                    : [];

                  // Se o reparo reduziu truncamentos, preferir o reparo
                  if (repairedSuspeitas.length < suspeitas.length) {
                    repaired.observacoes ??= [];
                    repaired.observacoes.push("Reparo aplicado: segunda passada para corrigir possíveis quebras de página/linha em capacidades.");

                    // Enforce: selecionadas ⊆ todas (mesma regra da resposta normal)
                    const repTodas = Array.isArray(repaired.capacidadesUC_todas) ? repaired.capacidadesUC_todas : null;
                    const repSel   = Array.isArray(repaired.capacidadesUC_selecionadas) ? repaired.capacidadesUC_selecionadas : null;
                    if (repTodas && repSel) {
                      const setTodas = new Set(repTodas.map(s => s.trim()));
                      const filtered = repSel.filter(s => setTodas.has(s.trim()));
                      if (filtered.length !== repSel.length) {
                        repaired.observacoes.push("Ajuste automático (reparo): removidas capacidades não presentes em 'capacidadesUC_todas' (verbatim).");
                        repaired.capacidadesUC_selecionadas = filtered;
                      }
                    }

                    return repaired;
                  }
                } catch (e: any) {
                  console.log(`[AI] Falha no reparo com ${repairModel}:`, e?.message ?? e);
                }
              }
            }
          }
        }

        // Se "todas" ou "selecionadas" vier "não localizado...", preserve.
        const todasArray = Array.isArray(dto.capacidadesUC_todas) ? dto.capacidadesUC_todas : null;
        const selArray   = Array.isArray(dto.capacidadesUC_selecionadas) ? dto.capacidadesUC_selecionadas : null;

        if (todasArray && selArray) {
          // enforce: selecionadas ⊆ todas
          const setTodas = new Set(todasArray.map(s => s.trim()));
          const filtered = selArray.filter(s => setTodas.has(s.trim()));
          if (filtered.length !== selArray.length) {
            dto.observacoes.push("Ajuste automático: removidas capacidades não presentes em 'capacidadesUC_todas' (verbatim).");
            dto.capacidadesUC_selecionadas = filtered;
          }
        }

        // Se o modelo retornou selecionadas com itens, mas "todas" não tem nada, sinaliza (provável invenção)
        if (!todasArray && selArray) {
          dto.observacoes.push("Inconsistência: 'capacidadesUC_selecionadas' preenchidas sem 'capacidadesUC_todas'. Verificar PDFs/UC informada.");
        }
        
        // Armazenar no cache (se habilitado)
        if (env.AI_CACHE_ENABLED) {
          responseCache.set(cacheKey, {
            response: dto,
            timestamp: Date.now()
          });
          
          // Limpar cache antigo (manter apenas últimos 100 itens)
          if (responseCache.size > 100) {
            const oldestKey = responseCache.keys().next().value;
            if (oldestKey) {
              responseCache.delete(oldestKey);
            }
          }
        }
        
        return dto;
      }
    } catch (error: any) {
      lastError = error;
      console.log(`[AI] Erro com modelo ${modelName}:`, error.message);
      
      // Se é erro de permissão de arquivo, relançar para ser tratado pelo nível superior
      if (isFilePermissionError(error)) {
        throw error;
      }
      
      const isModelNotFound = error.message?.includes('404') || error.message?.includes('not found');
      const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
      const isTruncated = error.message?.includes('JSON_TRUNCATED');
      
      if (!isRateLimit && !isModelNotFound && !isTruncated) {
        throw error;
      }
      
      // Aguardar um pouco antes de tentar o próximo modelo
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  const lastMsg = lastError?.message || '';
  if (lastMsg.includes('429') || lastMsg.includes('quota')) {
    throw new Error("429 — Cota da API Gemini esgotada para todos os modelos disponíveis.");
  }
  throw new Error(`Todos os modelos falharam. Último erro: ${lastMsg || 'Erro desconhecido'}`);
}
