# PDFs de Referência

Esta pasta contém os PDFs que serão enviados para o Gemini como contexto.

## Arquivos necessários:

### Planos de Curso:
1. **Adaptação SC - CT Desenvolvimento de Sistemas Presencial.pdf** - Plano de curso para Desenvolvimento de Sistemas
2. **Projeto de Curso_Informática para Internet 1000 SENAI SED.pdf** - Plano de curso para Informática para Internet
3. **Projeto de Curso_Programação de Jogos Digitais 1000 SENAI SED.pdf** - Plano de curso para Programação de Jogos Digitais

### Metodologia:
4. **arquivos_MSEP.pdf** - Arquivo de metodologia e estratégias de ensino

## Como adicionar os PDFs:

1. Coloque os arquivos PDF nesta pasta
2. Certifique-se de que os nomes dos arquivos correspondem exatamente aos esperados
3. O sistema identificará automaticamente qual plano de curso usar baseado no texto digitado no formulário

## Sistema de Identificação:

O sistema usa palavras-chave para identificar automaticamente qual PDF usar:
- **Desenvolvimento de Sistemas**: palavras como "desenvolvimento", "sistemas", "presencial", "sc", "ct"
- **Informática para Internet**: palavras como "informática", "internet", "senai", "sed", "1000"
- **Programação de Jogos Digitais**: palavras como "programação", "jogos", "digitais", "senai", "sed", "1000"

## Adicionando Novos Planos de Curso:

Para adicionar novos planos de curso, edite o arquivo `src/ai/service.ts` na função `ensureBasePdfsUploaded()` e adicione:

```typescript
await ensurePdfUploaded(
  "Nome do Novo Plano", 
  path.join(base, "nome_do_arquivo.pdf"),
  "plano_curso",
  ["palavra1", "palavra2", "palavra3"] // palavras-chave para identificação
);
```

## Nota:

Os PDFs serão enviados para o Google AI File API na primeira execução e os IDs serão armazenados em `src/data/resources.json` para reutilização posterior.
