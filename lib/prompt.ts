export function buildPromptForNotebookLM(input: {
  titulo: string; 
  descricaoBreve: string; 
  atividade?: string | null; 
  estrategiaEnsino: string; 
  planoCurso: string; 
  unidadeCurricular: string;
}) {
  const atividadeText = input.atividade ? `Atividade realizada: ${input.atividade}. ` : '';  // Se houver atividade, incluir no prompt

  // O prompt que será enviado para o Notebook LM
  return `
Você é um assistente educacional responsável por gerar uma descrição de aula com base nas informações fornecidas. O objetivo é criar uma descrição objetiva e precisa, com os seguintes itens:

1. **Título da aula**: "${input.titulo}"
2. **Descrição**: Expanda a descrição breve fornecida de forma clara e objetiva, mantendo o formato fornecido e com foco no conteúdo abordado.
3. **Atividades**: Se houver atividades realizadas, mencione-as de forma objetiva. Se não houver, ignore o campo.
4. **Estratégia de Ensino**: Inclua a estratégia de ensino fornecida de forma clara.
5. **Capacidades**: As capacidades associadas ao **plano de curso** "${input.planoCurso}" e à **unidade curricular** "${input.unidadeCurricular}". **Não altere as capacidades** e **repita-as exatamente** como estão no plano de curso e unidade curricular.

**Plano de curso**: "${input.planoCurso}"
**Unidade Curricular**: "${input.unidadeCurricular}"

**Descrição**:
- Expanda a descrição inicial fornecida para incluir o contexto e pontos principais da aula.
- Não altere as capacidades.

**Saída esperada**:
---
**Título**: "${input.titulo}"

**Descrição**: "${input.descricaoBreve}"

**Atividades realizadas**: "${atividadeText}"

**Estratégia de Ensino**: "${input.estrategiaEnsino}"

**Capacidades desenvolvidas**:
- [Capacidade 1]
- [Capacidade 2]
- [Capacidade 3]
- [etc.]

**Caso o plano de curso ou unidade curricular não sejam encontrados, informe ao usuário com a mensagem**:
"Erro: O plano de curso ou unidade curricular fornecida não foi encontrada."
`;
}
