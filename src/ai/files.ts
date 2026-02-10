import { GoogleAIFileManager } from "@google/generative-ai/server";
import { env } from "../config/env";
import fs from "node:fs/promises";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "src", "data", "resources.json");

type Resource = { 
  name: string; 
  fileId: string; 
  uri: string; 
  mimeType: string; 
  source: "local"|"gcs";
  type: "plano_curso" | "metodologia";
  keywords?: string[]; // palavras-chave para identificar o plano de curso
};
type Store = { resources: Resource[] };

// Cache em memória para ambientes read-only (serverless)
let memoryCache: Store = { resources: [] };
let isReadOnlyFS: boolean | null = null;

// Detectar se o sistema de arquivos é somente leitura
async function detectReadOnlyFS(): Promise<boolean> {
  if (isReadOnlyFS !== null) return isReadOnlyFS;
  
  try {
    // Tentar criar um arquivo temporário para testar
    const testPath = path.join(process.cwd(), "src", "data", ".test-write");
    await fs.writeFile(testPath, "test");
    await fs.unlink(testPath); // Limpar arquivo de teste
    isReadOnlyFS = false;
    console.log('[AI] Sistema de arquivos é gravável');
  } catch (error: any) {
    if (error.code === 'EROFS' || error.code === 'EACCES' || error.message?.includes('read-only')) {
      isReadOnlyFS = true;
      console.log('[AI] Sistema de arquivos é somente leitura - usando cache em memória');
    } else {
      isReadOnlyFS = false;
      console.log('[AI] Sistema de arquivos é gravável');
    }
  }
  
  return isReadOnlyFS;
}

async function readStore(): Promise<Store> {
  const isReadOnly = await detectReadOnlyFS();
  
  // Em serverless (read-only), ainda conseguimos LER arquivos empacotados no deploy.
  // Portanto: preferir cache em memória (se já populado) e, caso vazio, tentar ler do arquivo.
  if (isReadOnly && memoryCache.resources.length > 0) {
    console.log('[AI] Lendo cache em memória (sistema read-only)');
    return memoryCache;
  }
  
  try { 
    return JSON.parse(await fs.readFile(DB_PATH, "utf-8")); 
  }
  catch { 
    return isReadOnly ? memoryCache : { resources: [] };
  }
}

async function writeStore(data: Store) {
  const isReadOnly = await detectReadOnlyFS();
  
  if (isReadOnly) {
    console.log('[AI] Salvando cache em memória (sistema read-only)');
    memoryCache = data;
    return;
  }
  
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error: any) {
    // Se falhar ao escrever no disco, usar cache em memória
    if (error.code === 'EROFS' || error.code === 'EACCES') {
      console.log('[AI] Fallback para cache em memória devido a erro de escrita');
      memoryCache = data;
    } else {
      throw error;
    }
  }
}

export async function ensurePdfUploaded(
  name: string, 
  localPath: string, 
  type: "plano_curso" | "metodologia",
  keywords?: string[],
  mimeType="application/pdf"
): Promise<Resource> {
  const store = await readStore();
  const found = store.resources.find(r => r.name === name);
  if (found?.uri) {
    console.log(`[AI] Arquivo ${name} já existe no cache: ${found.fileId}`);
    return found;
  }

  console.log(`[AI] Fazendo upload do arquivo: ${name}`);
  console.log(`[AI] Caminho local: ${localPath}`);
  
  try {
    const fm = new GoogleAIFileManager(env.GOOGLE_AI_API_KEY);
    const uploaded = await fm.uploadFile(localPath, { mimeType, displayName: name });
    
    // Atenção: use os campos corretos retornados pelo SDK:
    // uploaded.file.name  -> "files/abc123"
    // uploaded.file.uri   -> "https://generativelanguage.googleapis.com/v1beta/files/abc123"
    const fileId = uploaded.file.name;
    const uri = uploaded.file.uri;
    
    console.log(`[AI] Upload concluído: ${name} -> ${fileId}`);
    console.log(`[AI] URI completa: ${uri}`);
    
    // Aguardar o processamento do arquivo
    console.log(`[AI] Aguardando processamento do arquivo...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
    
    // Verificar se o arquivo está pronto
    let attempts = 0;
    const maxAttempts = 6; // 60 segundos total
    
    while (attempts < maxAttempts) {
      try {
        const file = await fm.getFile(fileId);
        console.log(`[AI] Arquivo processado: ${file.name} (${file.state})`);
        
        if (file.state === 'ACTIVE') {
          break; // Arquivo pronto
        } else if (file.state === 'FAILED') {
          throw new Error(`Arquivo falhou no processamento: ${file.name}`);
        }
        
        // Aguardar mais um pouco se ainda não estiver pronto
        console.log(`[AI] Arquivo ainda processando (${file.state}), aguardando mais 10s...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      } catch (error) {
        console.log(`[AI] Tentativa ${attempts + 1}/${maxAttempts} - Arquivo ainda não disponível, aguardando...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }
    
    const res: Resource = { 
      name, 
      fileId, 
      uri, 
      mimeType, 
      source: "local",
      type,
      keywords: keywords || []
    };
    
    // Remove duplicados e adiciona novo
    store.resources = store.resources.filter(r => r.name !== name).concat(res);
    await writeStore(store);
    return res;
  } catch (error: any) {
    console.error(`[AI] Erro no upload de ${name}:`, error.message);
    throw new Error(`Falha no upload do arquivo ${name}: ${error.message}`);
  }
}

export async function getAllResources(): Promise<Resource[]> {
  const store = await readStore();
  return store.resources;
}

export async function getAllResourceIds(): Promise<string[]> {
  const store = await readStore();
  return store.resources.map(r => r.fileId);
}

export async function getResourceIdsByType(type: "plano_curso" | "metodologia"): Promise<string[]> {
  const store = await readStore();
  return store.resources
    .filter(r => r.type === type)
    .map(r => r.fileId);
}

export async function findPlanoCursoByKeywords(planoCurso: string): Promise<Resource | null> {
  const store = await readStore();
  const planos = store.resources.filter(r => r.type === "plano_curso");
  
  // Busca exata primeiro
  const exactMatch = planos.find(r => 
    r.name.toLowerCase().includes(planoCurso.toLowerCase()) ||
    r.keywords?.some(keyword => 
      planoCurso.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  if (exactMatch) return exactMatch;
  
  // Busca por palavras-chave
  const keywordMatch = planos.find(r => 
    r.keywords?.some(keyword => 
      planoCurso.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(planoCurso.toLowerCase())
    )
  );
  
  return keywordMatch || null;
}

export async function getMetodologiaResource(): Promise<Resource | null> {
  const store = await readStore();
  const metodologia = store.resources.find(r => r.type === "metodologia");
  return metodologia || null;
}

export async function clearResourcesCache(): Promise<void> {
  console.log('[AI] Limpando cache de recursos devido a erro 403...');
  const emptyStore: Store = { resources: [] };
  await writeStore(emptyStore);
  console.log('[AI] Cache de recursos limpo com sucesso');
}

// Função para obter informações sobre o tipo de armazenamento atual
export async function getStorageInfo(): Promise<{ type: 'file' | 'memory'; isReadOnly: boolean }> {
  const isReadOnly = await detectReadOnlyFS();
  return {
    type: isReadOnly ? 'memory' : 'file',
    isReadOnly
  };
}
