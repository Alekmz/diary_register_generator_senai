# Gerador de Registro de Diário - SENAI

Sistema para geração automática de diários de aula utilizando IA (Gemini) com base em planos de curso e livros de metodologia.

## 🚀 Funcionalidades

- **Interface intuitiva**: Formulário para preenchimento dos dados da aula
- **Integração com IA**: Geração automática de diários usando Google Gemini
- **Grounded AI**: Respostas baseadas em PDFs específicos (Plano de Curso e Livro de Metodologia)
- **Feature Flag**: Possibilidade de habilitar/desabilitar a IA sem quebrar o sistema
- **Cache de arquivos**: Upload único dos PDFs com reutilização dos IDs

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **IA**: Google Gemini 1.5 Pro
- **Upload de arquivos**: Google AI File API

## 📋 Pré-requisitos

1. Node.js 18+ 
2. Chave da API do Google AI Studio
3. PDFs do Plano de Curso e Livro de Metodologia

## ⚙️ Configuração

1. **Clone o repositório**:
   ```bash
   git clone <url-do-repositorio>
   cd diary_register_generator_senai
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp env.example .env.local
   ```
   
   Edite o arquivo `.env.local` com suas configurações:
   ```env
   GOOGLE_AI_API_KEY=sua_chave_aqui
   AI_GEMINI_ENABLED=true
   AI_MODEL_NAME=gemini-1.5-pro
   AI_TIMEOUT_MS=60000
   AI_MAX_OUTPUT_TOKENS=8192
   ```

4. **Adicione os PDFs**:
   - Coloque os arquivos de planos de curso em `assets/pdfs/`:
     - `Adaptação SC - CT Desenvolvimento de Sistemas Presencial.pdf`
     - `Projeto de Curso_Informática para Internet 1000 SENAI SED.pdf`
     - `Projeto de Curso_Programação de Jogos Digitais 1000 SENAI SED.pdf`
   - Coloque o arquivo de metodologia:
     - `arquivos_MSEP.pdf`

5. **Execute o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

6. **Acesse a aplicação**:
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🧪 Teste da Integração

Para testar se a integração com o Gemini está funcionando:

```bash
node test-gemini.js
```

## 📁 Estrutura do Projeto

```
├── app/
│   ├── api/
│   │   ├── generate/          # API legada (NotebookLM)
│   │   └── gemini/
│   │       └── generate/      # Nova API com Gemini
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Interface principal
├── src/
│   ├── ai/
│   │   ├── client.ts          # Cliente Gemini
│   │   ├── files.ts           # Upload e cache de PDFs
│   │   ├── pdf-config.ts      # Configuração dos PDFs
│   │   ├── prompt.ts          # Construção de prompts
│   │   └── service.ts         # Lógica de geração
│   └── config/
│       └── env.ts             # Configurações de ambiente
├── assets/
│   └── pdfs/                  # PDFs de referência
└── src/data/
    └── resources.json         # Cache de IDs dos arquivos
```

## 🔧 Como Usar

1. **Preencha o formulário** com os dados da aula:
   - Título da aula
   - Descrição breve
   - Atividades (opcional)
   - Plano de curso
   - Unidade curricular
   - Estratégia de ensino

2. **Clique em "Gerar Registro"**

3. **Aguarde a geração** (pode levar alguns segundos)

4. **Copie o resultado** diretamente para seu diário de aula

## ⚡ Feature Flags

O sistema possui uma feature flag que permite desabilitar a IA:

```env
AI_GEMINI_ENABLED=false
```

Quando desabilitada, o sistema retorna o prompt original para cópia manual no NotebookLM.

## 🔒 Segurança

- As chaves de API são mantidas apenas no servidor
- Os PDFs são enviados apenas para o Google AI File API
- Não há armazenamento de dados sensíveis no frontend

## 🐛 Troubleshooting

### Erro: "GOOGLE_AI_API_KEY ausente"
- Verifique se a variável de ambiente está configurada corretamente
- Certifique-se de que o arquivo `.env.local` existe

### Erro: "Resposta vazia do Gemini"
- Verifique se os PDFs estão na pasta `assets/pdfs/`
- Confirme se a chave da API tem permissões para o Gemini

### Timeout na geração
- Aumente o valor de `AI_TIMEOUT_MS` no arquivo de configuração
- Verifique sua conexão com a internet

### Erro 429 (Rate Limit)
- O sistema usa `gemini-2.0-flash-exp` que tem quotas maiores
- Cache habilitado reduz chamadas desnecessárias
- Sistema de retry automático com backoff exponencial
- Consulte `RATE_LIMITS.md` para detalhes completos

## 📝 Logs

O sistema registra logs importantes no console:
- Início e fim da geração
- Erros de upload de arquivos
- Timeouts e retries

## 🔧 Adicionando Novos Planos de Curso

Para adicionar novos planos de curso ao sistema:

1. **Adicione o PDF** na pasta `assets/pdfs/`

2. **Configure o mapeamento** no arquivo `src/ai/pdf-config.ts`:
   ```typescript
   export const PLANOS_CURSO_CONFIG: PlanoCursoConfig[] = [
     // ... planos existentes ...
     {
       nome: "Nome do Novo Plano",
       arquivo: "nome_do_arquivo.pdf",
       keywords: ["palavra1", "palavra2", "palavra3"],
       descricao: "Descrição do plano de curso"
     }
   ];
   ```

3. **Reinicie o servidor** para que as mudanças tenham efeito

O sistema identificará automaticamente qual PDF usar baseado nas palavras-chave definidas.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.