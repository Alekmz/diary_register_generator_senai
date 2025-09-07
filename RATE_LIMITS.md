# Rate Limits e Otimizações - Gemini API

## 🚨 Problema de Rate Limits

O erro 429 "Too Many Requests" indica que você atingiu os limites de quota da API do Gemini. Este documento explica as soluções implementadas.

## 🔧 Soluções Implementadas

### 1. **Modelo Mais Eficiente**
- **Mudança**: `gemini-1.5-pro` → `gemini-2.0-flash-exp`
- **Benefícios**:
  - Quotas mais generosas
  - Resposta mais rápida
  - Menor consumo de tokens

### 2. **Sistema de Retry Inteligente**
- **Tentativas**: 5 tentativas (antes: 3)
- **Delay Exponencial**: 1s, 2s, 4s, 8s, 16s
- **Rate Limit Detection**: Detecta erros 429 e ajusta delay
- **Delay Máximo**: 30 segundos para rate limits

### 3. **Cache de Respostas**
- **TTL**: 5 minutos por resposta
- **Chave**: Baseada no prompt + plano de curso
- **Benefício**: Evita chamadas duplicadas
- **Configurável**: `AI_CACHE_ENABLED=true/false`

### 4. **Logs Detalhados**
- Monitora tentativas de retry
- Identifica rate limits
- Mostra delays aplicados

## 📊 Limites da API Gemini

### Gemini 2.0 Flash (Recomendado)
- **Requests/minuto**: 15 (Free Tier)
- **Requests/dia**: 1,500 (Free Tier)
- **Tokens/minuto**: 1M (Free Tier)
- **Tokens/dia**: 50M (Free Tier)

### Gemini 1.5 Pro (Anterior)
- **Requests/minuto**: 2 (Free Tier)
- **Requests/dia**: 1,500 (Free Tier)
- **Tokens/minuto**: 32K (Free Tier)
- **Tokens/dia**: 50M (Free Tier)

## ⚙️ Configurações Recomendadas

### Para Desenvolvimento
```env
AI_MODEL_NAME=gemini-2.0-flash-exp
AI_CACHE_ENABLED=true
AI_TIMEOUT_MS=60000
```

### Para Produção (com billing)
```env
AI_MODEL_NAME=gemini-1.5-pro
AI_CACHE_ENABLED=true
AI_TIMEOUT_MS=30000
```

## 🚀 Dicas de Otimização

### 1. **Use o Cache**
- Mantenha `AI_CACHE_ENABLED=true`
- Respostas idênticas são reutilizadas
- Reduz drasticamente chamadas à API

### 2. **Evite Testes Excessivos**
- Use dados diferentes para cada teste
- Ou desabilite temporariamente: `AI_GEMINI_ENABLED=false`

### 3. **Monitore os Logs**
```bash
# Logs importantes:
[AI] Rate limit atingido. Tentativa 2/5. Aguardando 2000ms...
[AI] Resposta encontrada no cache
```

### 4. **Implemente Backoff**
- O sistema já implementa backoff exponencial
- Aguarde entre tentativas de teste
- Use delays maiores em produção

## 🔄 Estratégias de Fallback

### 1. **Modo Legado**
```env
AI_GEMINI_ENABLED=false
```
- Retorna prompt para cópia manual
- Funciona sem limites de API

### 2. **Cache Persistente** (Futuro)
- Implementar cache em banco de dados
- Persistir respostas entre reinicializações

### 3. **Rate Limiting Client-Side**
- Implementar fila de requisições
- Distribuir chamadas ao longo do tempo

## 📈 Monitoramento

### Logs a Observar
```bash
# Sucesso
[AI] Resposta gerada com sucesso

# Rate Limit
[AI] Rate limit atingido. Tentativa X/5. Aguardando Yms...

# Cache Hit
[AI] Resposta encontrada no cache

# Erro
[AI] Erro após 5 tentativas: [mensagem]
```

### Métricas Importantes
- Taxa de cache hit
- Número de retries
- Tempo de resposta médio
- Erros de rate limit

## 🆘 Resolução de Problemas

### Erro 429 Persistente
1. Verifique se está usando `gemini-2.0-flash-exp`
2. Habilite o cache: `AI_CACHE_ENABLED=true`
3. Aguarde alguns minutos antes de tentar novamente
4. Considere upgrade para plano pago

### Respostas Lentas
1. Verifique se o cache está funcionando
2. Reduza `AI_MAX_OUTPUT_TOKENS` se necessário
3. Use prompts mais específicos

### Erros de Upload de PDF
1. Verifique se os PDFs estão na pasta correta
2. Confirme se os nomes dos arquivos estão corretos
3. Verifique permissões de leitura dos arquivos

## 📞 Suporte

Para problemas persistentes:
1. Verifique os logs do console
2. Confirme configurações do `.env.local`
3. Teste com `AI_GEMINI_ENABLED=false` primeiro
4. Consulte a documentação oficial: https://ai.google.dev/gemini-api/docs/rate-limits
