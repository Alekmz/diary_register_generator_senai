# Sistema de Recuperação Automática - Erros 403

## 🚀 Nova Funcionalidade

O sistema agora possui **recuperação automática** para erros 403 relacionados a arquivos do Google AI Studio e **suporte completo a ambientes serverless** com sistemas de arquivos somente leitura.

## 🔧 Como Funciona

### Detecção Automática de Ambiente
O sistema detecta automaticamente o tipo de ambiente:
- **Ambiente Gravável**: Usa arquivo `resources.json` para persistir cache
- **Ambiente Read-Only**: Usa cache em memória (serverless/Lambda)

### Detecção Automática de Erros
O sistema detecta automaticamente erros 403 relacionados a arquivos através de:
- Mensagens contendo "403" ou "Forbidden"
- Palavras-chave como "permission", "access", "not exist"
- Referências a "File" com códigos de erro 403

### Processo de Recuperação
1. **Detecção de Ambiente**: Identifica se sistema de arquivos é read-only
2. **Primeira Tentativa**: Sistema tenta usar arquivos do cache
3. **Detecção de Erro**: Se receber erro 403, identifica como problema de arquivo
4. **Limpeza Automática**: Limpa cache (arquivo ou memória conforme ambiente)
5. **Re-upload**: Faz upload automático de todos os PDFs novamente
6. **Segunda Tentativa**: Tenta gerar com os novos arquivos

## 📋 Logs de Exemplo

### Ambiente Gravável (Desenvolvimento Local)
```
[AI] Usando armazenamento: file (read-only: false)
[AI] Sistema de arquivos é gravável
[AI] Tentativa 1/2 - Iniciando upload de PDFs...
[AI] Erro na tentativa 1: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent: [403 Forbidden] You do not have permission to access the File 8up4hn52gi4d or it may not exist.
[AI] Detectado erro 403 relacionado a arquivos. Limpando cache e tentando novamente...
[AI] Limpando cache de recursos devido a erro 403...
[AI] Cache de recursos limpo com sucesso
[AI] Tentativa 2/2 - Iniciando upload de PDFs...
[AI] Fazendo upload do arquivo: arquivos_MSEP
[AI] Upload concluído: arquivos_MSEP -> files/[novo_id]
[AI] Sucesso com modelo: gemini-2.5-flash
```

### Ambiente Read-Only (Serverless/Vercel)
```
[AI] Usando armazenamento: memory (read-only: true)
[AI] Sistema de arquivos é somente leitura - usando cache em memória
[AI] Tentativa 1/2 - Iniciando upload de PDFs...
[AI] Lendo cache em memória (sistema read-only)
[AI] Erro na tentativa 1: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent: [403 Forbidden] You do not have permission to access the File 8up4hn52gi4d or it may not exist.
[AI] Detectado erro 403 relacionado a arquivos. Limpando cache e tentando novamente...
[AI] Limpando cache de recursos devido a erro 403...
[AI] Salvando cache em memória (sistema read-only)
[AI] Cache de recursos limpo com sucesso
[AI] Tentativa 2/2 - Iniciando upload de PDFs...
[AI] Fazendo upload do arquivo: arquivos_MSEP
[AI] Upload concluído: arquivos_MSEP -> files/[novo_id]
[AI] Sucesso com modelo: gemini-2.5-flash
```

## ⚙️ Configuração

A funcionalidade está **sempre ativa** e não requer configuração adicional.

### Limites
- **Máximo 2 tentativas** por requisição
- **Limpeza completa** do cache de recursos
- **Re-upload automático** de todos os PDFs

## 🛡️ Benefícios

1. **Resiliência**: Sistema se recupera automaticamente de arquivos expirados
2. **Transparência**: Usuário não precisa intervir manualmente
3. **Eficiência**: Evita falhas desnecessárias por problemas temporários
4. **Manutenção**: Reduz necessidade de intervenção manual
5. **Compatibilidade Serverless**: Funciona em Vercel, AWS Lambda, e outros ambientes read-only
6. **Detecção Automática**: Identifica automaticamente o tipo de ambiente

## 🔍 Casos de Uso

### Arquivos Expirados
- Google AI Studio expira arquivos após 30 dias (free tier)
- Sistema detecta e re-faz upload automaticamente

### Arquivos Deletados
- Se arquivos são removidos do Google AI Studio
- Sistema re-uploada automaticamente

### Problemas de Permissão
- Mudanças na API key ou permissões
- Sistema tenta novamente com novos uploads

### Ambientes Serverless
- Vercel, AWS Lambda, Netlify Functions
- Sistemas de arquivos somente leitura
- Cache automático em memória

## 📊 Monitoramento

Para monitorar o funcionamento:
1. **Console Logs**: Acompanhe mensagens `[AI]`
2. **Arquivo Cache**: Verifique `src/data/resources.json`
3. **Tempo de Resposta**: Primeira tentativa pode ser mais lenta

## 🚨 Troubleshooting

### Se o Problema Persistir
1. Verifique se `GOOGLE_AI_API_KEY` está válida
2. Confirme se os PDFs existem em `assets/pdfs/`
3. Verifique limites de quota da API

### Logs Importantes
- `[AI] Detectado erro 403 relacionado a arquivos`
- `[AI] Cache de recursos limpo com sucesso`
- `[AI] Upload concluído: [arquivo] -> files/[id]`

## 🔄 Fluxo Completo

```
Requisição → Cache Check → Upload PDFs → Geração
     ↓              ↓           ↓           ↓
   Sucesso      Erro 403    Limpar Cache  Re-upload
     ↓              ↓           ↓           ↓
   Retorna    Detecta Erro   Limpa JSON   Tenta Novamente
```

Esta funcionalidade torna o sistema muito mais robusto e confiável para uso em produção!
