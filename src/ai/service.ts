import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGenAI } from "./client";
import { 
  ensurePdfUploaded, 
  findPlanoCursoByKeywords, 
  getMetodologiaResource,
  getAllResources,
  clearResourcesCache
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

function tryParseJsonStrict(s: string): OutputDTO {
  // Limpar markdown se presente
  let cleaned = s.trim();
  
  // Remover blocos de markdown ```json ... ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Pega o último bloco iniciando em { até o fim (evita cabeçalhos indesejados)
  const m = cleaned.match(/\{[\s\S]*\}$/);
  const raw = m ? m[0] : cleaned;
  
  try {
    const obj = JSON.parse(raw);
    return OutputSchema.parse(obj);
  } catch (error) {
    console.error('[AI] Erro ao parsear JSON:', error);
    console.error('[AI] Texto recebido:', s);
    console.error('[AI] Texto limpo:', cleaned);
    console.error('[AI] Candidato JSON:', raw);
    throw new Error(`Falha ao parsear resposta JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

async function withRetries<T>(fn: () => Promise<T>, tries=5, baseMs=1000): Promise<T> {
  let lastErr: any;
  for (let i=0; i<tries; i++) {
    try { 
      return await fn(); 
    }
    catch (err: any) {
      lastErr = err;
      
      // Verificar se é erro de rate limit
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate')) {
        const retryDelay = err.message?.includes('RetryInfo') ? 
          Math.min(30000, baseMs * Math.pow(2, i)) : // Delay máximo de 30s
          baseMs * Math.pow(2, i);
        
        console.log(`[AI] Rate limit atingido. Tentativa ${i + 1}/${tries}. Aguardando ${retryDelay}ms...`);
        
        if (i < tries - 1) {
          await new Promise(r => setTimeout(r, retryDelay));
        }
      } else {
        // Para outros erros, usar delay normal
        if (i < tries - 1) {
          await new Promise(r => setTimeout(r, baseMs * Math.pow(2, i)));
        }
      }
    }
  }
  throw lastErr;
}

// Lista de modelos para fallback em caso de rate limit
// PRIORIZAR modelos 2.5 que suportam PDFs melhor
const FALLBACK_MODELS = [
  "gemini-2.5-flash",  // Suporta PDFs, mais rápido
  "gemini-2.5-pro",    // Suporta PDFs, mais preciso
  "gemini-1.5-flash",  // Fallback
  "gemini-1.5-pro",    // Fallback
];

export async function generateFromGemini(userPrompt: string, planoCurso: string): Promise<OutputDTO> {
  if (!env.AI_GEMINI_ENABLED) {
    // fallback: monta DTO com dados do formulário e marca capacidades como "não localizado..."
    throw new Error("AI desabilitado; habilite AI_GEMINI_ENABLED para geração.");
  }

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
  // Tentar diferentes modelos em caso de rate limit
  let lastError: any;
  
  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[AI] Tentando modelo: ${modelName}`);
      
      const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
          temperature: 0.0,
        },
      });

      const result = await withRetries(async () => {
        // Construir o prompt com system instruction
        const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n${userPrompt}`;
        
        // Usar URIs completas para todos os modelos
        const parts = [
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
          { text: fullPrompt }
        ];

        console.log(`[AI] Enviando request com ${parts.length} parts`);
        console.log(`[AI] PDF 1 URI: ${planoCursoResource.uri}`);
        console.log(`[AI] PDF 2 URI: ${metodologiaResource.uri}`);
        
        const res = await model.generateContent({ contents: [{ role: "user", parts }] });
        const text = res.response.text();
        return text?.trim() ?? "";
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
      
      // Se não é erro de rate limit, não tentar outros modelos
      if (!error.message?.includes('429') && !error.message?.includes('quota')) {
        throw error;
      }
      
      // Aguardar um pouco antes de tentar o próximo modelo
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  throw new Error(`Todos os modelos falharam. Último erro: ${lastError?.message || 'Erro desconhecido'}`);
}
