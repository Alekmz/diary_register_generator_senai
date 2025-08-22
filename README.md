# Gerador de Registro de Diário

Sistema em Next.js para gerar prompts estruturados para o Notebook LM do Google.

## Funcionalidades

- Formulário completo com todos os campos necessários
- Geração de prompt estruturado para o Notebook LM
- Iframe integrado com o Notebook LM
- Link direto para o Notebook LM (plano B)
- Interface moderna e responsiva
- Botão para copiar o prompt gerado

## Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Notebook LM (Google)
- Lucide React (ícones)

## Campos do Formulário

1. **Título da Aula** (obrigatório)
2. **Descrição Breve** (opcional)
3. **Atividade** (opcional) - se não preenchido, o prompt ignora
4. **Plano de Curso** (obrigatório)
5. **Unidade Curricular** (obrigatório)
6. **Estratégia de Ensino** (obrigatório)

## Como Usar

1. **Preencha o formulário** com os dados da aula
2. **Clique em "Gerar Registro"**
3. **O sistema retorna:**
   - Prompt estruturado para o Notebook LM
   - Iframe com o Notebook LM integrado
   - Link direto para o Notebook LM
4. **Copie o prompt** e cole no Notebook LM
5. **Use o iframe** ou link direto para acessar o Notebook LM

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o projeto:
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:3001`

## Notebook LM

O sistema está configurado para trabalhar com o Notebook LM em:
https://notebooklm.google.com/notebook/d63cf76d-c429-4ee7-916e-540ea81486b0

### Integração

- **Iframe:** O sistema tenta carregar o Notebook LM em um iframe
- **Link direto:** Se o iframe não funcionar, use o link direto
- **Prompt:** O prompt gerado pode ser copiado e colado no Notebook LM

## Deploy na Vercel

1. Conecte seu repositório à Vercel
2. Deploy automático será realizado
3. O sistema funcionará sem necessidade de variáveis de ambiente

## Estrutura do Projeto

```
├── app/
│   ├── api/generate/route.ts  # API para geração de prompt
│   ├── globals.css           # Estilos globais
│   ├── layout.tsx            # Layout principal
│   └── page.tsx              # Página principal
├── lib/
│   └── prompt.ts             # Builder de prompt
└── package.json
```

## Formato do Prompt

O sistema gera um prompt estruturado que inclui:
- Título da aula
- Descrição expandida
- Atividades (se houver)
- Estratégia de ensino
- Capacidades extraídas do plano de curso

## Exemplo de Uso

### Input:
- **Título:** "Introdução à Fotossíntese"
- **Descrição:** "Processo de produção de energia"
- **Atividade:** "Experimento prático"
- **Plano de Curso:** "Plano de Biologia"
- **Unidade Curricular:** "Fisiologia Vegetal"
- **Estratégia de Ensino:** "Aula prática com demonstração"

### Output:
- Prompt estruturado pronto para o Notebook LM
- Iframe com o Notebook LM integrado
- Link direto para o Notebook LM

## Suporte

Para mais informações sobre a integração com o Notebook LM, consulte o arquivo `NOTEBOOK_LM_INTEGRATION.md`.
