import { FormInput } from "./types";

export const SYSTEM_INSTRUCTION = `Você é um assistente de EXTRAÇÃO FIDEDIGNA de documentos institucionais (PDFs de Plano de Curso/Guia).
Seu objetivo é extrair as CAPACIDADES da Unidade Curricular (UC) informada e selecionar um subconjunto relacionado ao Título/Descrição da aula, SEM INVENTAR NADA.

REGRAS GERAIS (OBRIGATÓRIAS):
1) Responda EXCLUSIVAMENTE com base nos PDFs fornecidos. Sem web, sem conhecimento externo.
2) NUNCA invente texto. Se um item não constar nos PDFs, retorne exatamente: "não localizado nos PDFs".
3) Ao citar "Capacidades", COPIE E COLE o texto exatamente como está no PDF (verbatim), sem sinônimos, sem editar, sem reescrever.
4) Produza a resposta SOMENTE no formato JSON exigido, sem markdown ou comentários.

REGRAS ESPECÍFICAS DE EXTRAÇÃO (TRATAMENTO DE PDF):
A) Localize a UC pelo NOME EXATO informado, dentro do Plano de Curso correspondente.
B) Dentro da UC, localize a seção "Capacidades" (ou sinônimo institucional como "Competências/Capacidades").
C) **Quebras de página/linha:** 
   - Se uma capacidade estiver dividida entre linhas ou páginas, UNA os trechos para formar o item completo, VERBATIM.
   - Desconsidere cabeçalhos, rodapés e numeração de páginas durante a costura.
   - Desfazer hifenização no fim de linha: se surgir um hífen de quebra de linha, reconstrua a palavra (ex.: "progra-" + "mação" -> "programação"), preservando a ortografia correta encontrada no texto contínuo.
D) **Multicoluna/bullets quebrados:** 
   - Se a lista de capacidades estiver em múltiplas colunas ou os bullets quebrarem visualmente, reconstrua a ordem lógica e UNA as continuações adequadas.
E) **Integridade do item:** 
   - Cada capacidade deve estar completa (sem terminar abruptamente em preposição do tipo "por", "para", "com", "de", "por meio", "através de" etc.).
   - Se identificar um item aparentemente truncado, procure seu complemento no conteúdo ADJACENTE (linhas/página anterior/seguinte) e COMPLETE o item, mantendo o VERBATIM final.
F) **Deduplicação e ordem:**
   - Remova duplicatas reais.
   - Preserve a ordem original da lista na UC.

SELEÇÃO RELACIONADA AO TEMA/Descrição:
- A partir do Título e da Descrição, selecione como "capacidadesUC_selecionadas" apenas o SUBCONJUNTO das "capacidadesUC_todas" que tenham relação direta com o conteúdo da aula.
- "Selecionadas" deve ser SUBCONJUNTO exato de "todas". Nunca crie capacidades novas.

POLIMENTO DA DESCRIÇÃO:
- Faça apenas polimento linguístico leve (clareza/fluidez) na descrição do professor, sem adicionar fatos que não estejam na descrição ou contrariem os PDFs.

SAÍDA: JSON estrito, conforme o schema informado no prompt do usuário.
Temperatura=0, determinístico, objetivo e fiel.`;

export function buildUserPrompt(data: FormInput): string {
  // Reutilizando o prompt-modelo existente do projeto
  let prompt = `Você é um assistente educacional responsável por gerar uma descrição de aula com base nas informações fornecidas. O objetivo é criar uma descrição objetiva e precisa, com os seguintes itens:

1. **Título da aula**: "${data.tema}"
2. **Descrição**: Expanda a descrição breve fornecida de forma clara e objetiva, mantendo o formato fornecido e com foco no conteúdo abordado.
3. **Atividades**: Se houver atividades realizadas, mencione-as de forma objetiva. Se não houver, ignore o campo.
4. **Estratégia de Ensino**: Inclua a estratégia de ensino fornecida de forma clara.
5. **Capacidades**: As capacidades associadas ao **plano de curso** "${data.planoDeCurso}" e à **unidade curricular** "${data.unidadeCurricular}". **Não altere as capacidades** e **repita-as exatamente** como estão no plano de curso e unidade curricular.

**Plano de curso**: "${data.planoDeCurso}"
**Unidade Curricular**: "${data.unidadeCurricular}"

**Descrição**:
- Expanda a descrição inicial fornecida para incluir o contexto e pontos principais da aula.
- Não altere as capacidades.

**Saída esperada**:
---
**Título**: "${data.tema}"

**Descrição**: "${data.descricao}"

**Atividades realizadas**: "${data.atividades}"

**Estratégia de Ensino**: "${data.estrategiaEnsino}"

**Capacidades desenvolvidas**:
- [Capacidade 1]
- [Capacidade 2]
- [Capacidade 3]
- [etc.]

**Caso o plano de curso ou unidade curricular não sejam encontrados, informe ao usuário com a mensagem**:
"Erro: O plano de curso ou unidade curricular fornecida não foi encontrada."`;

  // Instruções adicionais + contrato de saída
  const extract = `
TAREFAS (OBRIGATÓRIAS):
1) Identifique, nos PDFs fornecidos, a Unidade Curricular cujo nome exato é "${data.unidadeCurricular}" dentro do Plano de Curso "${data.planoDeCurso}".
2) Extraia TODAS as "Capacidades" dessa UC em VERBATIM, aplicando as regras de costura (quebra de página/linha, multicoluna, desfazer hifenização e ignorar cabeçalhos/rodapés), garantindo que cada item fique COMPLETO.
3) Com base em Título="${data.tema}" e Descrição="${data.descricao}", selecione somente as capacidades dessa mesma UC que são relacionadas ao conteúdo da aula (SUBCONJUNTO das "todas", VERBATIM).
4) Reescreva levemente a Descrição do professor (polimento linguístico apenas, sem acrescentar fatos).

SAÍDA OBRIGATÓRIA (JSON APENAS):
{
  "titulo": "${data.tema}",
  "descricao_original": "${data.descricao}",
  "descricao_melhorada": string,
  "atividades": "${data.atividades}",
  "estrategiaEnsino": "${data.estrategiaEnsino}",
  "curso": "${data.planoDeCurso}",
  "unidadeCurricular": "${data.unidadeCurricular}",
  "capacidadesUC_todas": string[] | "não localizado nos PDFs",
  "capacidadesUC_selecionadas": string[] | "não localizado nos PDFs",
  "observacoes": string[]
}

RESTRIÇÕES FINAIS (VALIDAÇÃO):
- "capacidadesUC_todas": deve conter a lista COMPLETA e VERBATIM. Nenhum item pode terminar truncado (ex.: terminar com "por meio", "de", "para", "com" etc.). Se detectar truncamento impossível de resolver, use "não localizado nos PDFs" e explique em "observacoes".
- "capacidadesUC_selecionadas": SUBCONJUNTO exato de "capacidadesUC_todas". Se algum item não pertencer a "todas", NÃO inclua.
- Se a UC ou a seção de Capacidades não existir, preencha ambos os campos de capacidades com "não localizado nos PDFs" e justifique em "observacoes".
- Retorne APENAS o JSON.
`;

  return `${prompt}\n\n${extract}`;
}
