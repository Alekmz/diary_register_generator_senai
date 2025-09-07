# 🚨 Solução Rápida - Rate Limit

## ⚡ Passos Imediatos

### 1. **Reinicie o Servidor**
```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

### 2. **Teste os Modelos Disponíveis**
```bash
node test-models.js
```

### 3. **Configure o Modelo Funcionando**
Edite `.env.local` com o modelo que funcionou:
```env
AI_MODEL_NAME=gemini-1.5-flash  # ou o que funcionou no teste
```

### 4. **Modo de Emergência (Sem IA)**
Se nada funcionar, desabilite temporariamente:
```env
AI_GEMINI_ENABLED=false
```

## 🔧 O que Foi Implementado

### ✅ **Sistema de Fallback Inteligente**
- Tenta `gemini-2.0-flash-exp` primeiro
- Se falhar, tenta `gemini-1.5-flash`
- Se falhar, tenta `gemini-1.5-pro`
- Logs detalhados de cada tentativa

### ✅ **Cache Agressivo**
- Respostas idênticas são reutilizadas
- Reduz drasticamente chamadas à API
- TTL de 5 minutos

### ✅ **Retry Inteligente**
- 5 tentativas por modelo
- Backoff exponencial
- Detecção de rate limits

## 📊 Status dos Modelos

| Modelo | Status | Quotas |
|--------|--------|--------|
| `gemini-2.0-flash-exp` | 🟡 Experimental | Altas |
| `gemini-1.5-flash` | 🟢 Estável | Médias |
| `gemini-1.5-pro` | 🔴 Limitado | Baixas |

## 🚀 Próximos Passos

1. **Execute o teste**: `node test-models.js`
2. **Configure o melhor modelo** no `.env.local`
3. **Reinicie o servidor**
4. **Teste a aplicação**

## 📞 Se Ainda Não Funcionar

1. **Aguarde 1 hora** (rate limits resetam)
2. **Use modo legado**: `AI_GEMINI_ENABLED=false`
3. **Verifique sua conta** no Google AI Studio
4. **Considere upgrade** para plano pago

## 🔍 Logs para Monitorar

```bash
[AI] Tentando modelo: gemini-2.0-flash-exp
[AI] Erro com modelo gemini-2.0-flash-exp: 429 Too Many Requests
[AI] Tentando modelo: gemini-1.5-flash
[AI] Sucesso com modelo: gemini-1.5-flash
```

## ⚠️ Importante

- **Rate limits são por projeto**, não por modelo
- **Cache reduz** chamadas desnecessárias
- **Fallback automático** tenta todos os modelos
- **Modo legado** sempre funciona como backup
