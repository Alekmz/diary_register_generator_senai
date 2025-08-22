import { NextRequest } from "next/server";
import { buildPromptForNotebookLM } from "@/lib/prompt";

export const runtime = "edge";

// Função para simular a resposta do Notebook LM
async function simulateNotebookLMResponse(prompt: string, data: any) {
  const atividadeText = data.atividade?.trim() ? `\n  • Atividade específica: ${data.atividade}` : '';
  
  return `Título: ${data.titulo}

Descrição:
- Contexto/objetivo: Esta aula do plano de curso ${data.planoCurso} na unidade curricular de ${data.unidadeCurricular} aborda os conceitos fundamentais de ${data.titulo.toLowerCase()}, proporcionando aos estudantes uma compreensão sólida dos princípios básicos e aplicações práticas do tema em questão.

- Principais pontos abordados:
  • Conceitos fundamentais e definições essenciais
  • Processos e mecanismos principais
  • Aplicações práticas e exemplos do cotidiano
  • Relacionamentos com outros conceitos da disciplina

- Estratégia de ensino:
  • ${data.estrategiaEnsino}${atividadeText}
  • Exposição dialogada com participação ativa dos estudantes
  • Utilização de recursos visuais e exemplos práticos
  • Discussão em grupo sobre aplicações reais
  • Exercícios de fixação e verificação de aprendizagem

- Atividades realizadas:
  • Aplicação prática dos conceitos teóricos
  • Desenvolvimento de habilidades específicas da disciplina
  • Integração de conhecimentos interdisciplinares

- Capacidades desenvolvidas:
  • Capacidade 1 para ${data.unidadeCurricular}
  • Capacidade 2 para ${data.unidadeCurricular}
  • Capacidade 3 para ${data.unidadeCurricular}
  • Capacidade 4 para ${data.unidadeCurricular}`;
}

export async function POST(req: NextRequest) {
  try {
    const { titulo, descricao, atividade, planoCurso, unidadeCurricular, estrategiaEnsino } = await req.json();

    if (!titulo) {
      return new Response(JSON.stringify({ error: "Título é obrigatório" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!planoCurso) {
      return new Response(JSON.stringify({ error: "Plano de curso é obrigatório" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!unidadeCurricular) {
      return new Response(JSON.stringify({ error: "Unidade curricular é obrigatória" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!estrategiaEnsino) {
      return new Response(JSON.stringify({ error: "Estratégia de ensino é obrigatória" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }



    const prompt = buildPromptForNotebookLM({ 
      titulo, 
      descricaoBreve: descricao, 
      atividade, 
      planoCurso, 
      unidadeCurricular, 
      estrategiaEnsino 
    });

    // Retornar o prompt gerado para ser usado no Notebook LM
    return new Response(JSON.stringify({ 
      prompt: prompt,
      notebookUrl: "https://notebooklm.google.com/notebook/d63cf76d-c429-4ee7-916e-540ea81486b0"
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return new Response(JSON.stringify({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
