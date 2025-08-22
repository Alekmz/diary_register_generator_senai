# Integração com Notebook LM

## Seu Notebook LM
URL: https://notebooklm.google.com/notebook/d63cf76d-c429-4ee7-916e-540ea81486b0

## Como Funciona

### 1. **Sistema Atual (Simulação)**
O sistema está configurado para simular a resposta do Notebook LM enquanto você configura a integração real.

### 2. **Campos do Formulário**
- **Título da Aula** (obrigatório)
- **Descrição Breve** (opcional)
- **Atividade** (opcional) - se não preenchido, o prompt ignora
- **Plano de Curso** (obrigatório)
- **Unidade Curricular** (obrigatório)
- **Estratégia de Ensino** (obrigatório)

### 3. **Prompt Gerado**
O sistema gera um prompt estruturado que inclui:
- Título da aula
- Descrição expandida
- Atividades (se houver)
- Estratégia de ensino
- Capacidades extraídas do plano de curso

### 4. **Formato do Prompt**
```ts
Você é um assistente educacional responsável por gerar uma descrição de aula com base nas informações fornecidas.

1. **Título da aula**: "[TÍTULO]"
2. **Descrição**: Expanda a descrição breve fornecida
3. **Atividades**: Se houver atividades realizadas, mencione-as
4. **Estratégia de Ensino**: Inclua a estratégia fornecida
5. **Capacidades**: As capacidades associadas ao plano de curso "[PLANO]" e unidade curricular "[UC]"

**Saída esperada**:
---
**Título**: [TÍTULO]
**Descrição**: [DESCRIÇÃO EXPANDIDA]
**Atividades realizadas**: [ATIVIDADES]
**Estratégia de Ensino**: [ESTRATÉGIA]
**Capacidades desenvolvidas**:
- [Capacidade 1]
- [Capacidade 2]
- [etc.]
```

## Como Integrar com seu Notebook LM

### Opção 1: Integração Manual
1. Copie o prompt gerado pelo sistema
2. Cole no seu Notebook LM
3. Obtenha a resposta
4. Cole a resposta de volta no sistema

### Opção 2: Integração via API (Futuro)
Quando o Google disponibilizar a API do Notebook LM, você poderá:
1. Configurar a API key
2. O sistema enviará automaticamente o prompt
3. Receberá a resposta processada

### Opção 3: Webhook/Integração Customizada
Você pode criar um webhook que:
1. Recebe o prompt do sistema
2. Envia para o Notebook LM via interface web
3. Processa a resposta
4. Retorna para o sistema

## Exemplo de Uso

### Input:
- **Título**: "Introdução à Fotossíntese"
- **Descrição**: "Processo de produção de energia"
- **Atividade**: "Experimento prático"
- **Plano de Curso**: "Plano de Biologia"
- **Unidade Curricular**: "Fisiologia Vegetal"
- **Estratégia de Ensino**: "Aula prática com demonstração"

### Output Esperado:
```
Título: Introdução à Fotossíntese

Descrição:
- Contexto/objetivo: Esta aula do plano de curso Plano de Biologia na unidade curricular de Fisiologia Vegetal aborda os conceitos fundamentais de introdução à fotossíntese...

- Principais pontos abordados:
  • Conceitos fundamentais e definições essenciais
  • Processos e mecanismos principais
  • Aplicações práticas e exemplos do cotidiano

- Estratégia de ensino:
  • Aula prática com demonstração
  • Atividade específica: Experimento prático
  • Exposição dialogada com participação ativa

- Atividades realizadas:
  • Aplicação prática dos conceitos teóricos
  • Desenvolvimento de habilidades específicas

- Capacidades desenvolvidas:
  • Capacidade 1 para Fisiologia Vegetal
  • Capacidade 2 para Fisiologia Vegetal
  • Capacidade 3 para Fisiologia Vegetal
```

## Próximos Passos

1. **Teste o sistema atual** - Use a simulação para verificar se o formato está correto
2. **Configure seu Notebook LM** - Adicione o prompt como template no seu notebook
3. **Teste a integração manual** - Copie e cole o prompt/resposta
4. **Aguarde a API oficial** - Quando disponível, configure a integração automática

## Suporte

Se precisar de ajuda com a integração ou tiver dúvidas sobre o formato do prompt, entre em contato!
