import { NextRequest, NextResponse } from "next/server";
import { buildUserPrompt } from "@/src/ai/prompt";
import { generateFromGemini } from "@/src/ai/service";
import { FormInput } from "@/src/ai/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { titulo, descricao, atividade, planoCurso, unidadeCurricular, estrategiaEnsino } = await req.json();

    if (!titulo) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    if (!planoCurso) {
      return NextResponse.json({ error: "Plano de curso é obrigatório" }, { status: 400 });
    }

    if (!unidadeCurricular) {
      return NextResponse.json({ error: "Unidade curricular é obrigatória" }, { status: 400 });
    }

    if (!estrategiaEnsino) {
      return NextResponse.json({ error: "Estratégia de ensino é obrigatória" }, { status: 400 });
    }

    const formData: FormInput = { 
      tema: titulo, 
      descricao, 
      atividades: atividade || "", 
      planoDeCurso: planoCurso, 
      unidadeCurricular, 
      estrategiaEnsino 
    };

    const userPrompt = buildUserPrompt(formData);
    const dto = await generateFromGemini(userPrompt, planoCurso);

    return NextResponse.json({ ok: true, data: dto });
  } catch (err: any) {
    console.error("[/api/gemini/generate] error:", err);
    
    const msg = err?.message ?? "";
    let userMessage = "Erro interno ao gerar conteúdo.";
    let status = 500;

    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
      userMessage =
        "Cota gratuita da API Gemini esgotada. " +
        "Aguarde alguns minutos e tente novamente, ou tente amanhã quando a cota diária for renovada.";
      status = 429;
    } else if (msg.includes("404") || msg.includes("not found")) {
      userMessage = "Modelo de IA indisponível. Verifique a configuração AI_MODEL_NAME no .env.";
      status = 502;
    } else if (msg.includes("JSON_TRUNCATED") || msg.includes("Unterminated") || msg.includes("Unexpected end")) {
      userMessage =
        "A resposta da IA foi cortada antes de completar. " +
        "Tente novamente — se o problema persistir, aumente AI_MAX_OUTPUT_TOKENS no .env.";
      status = 502;
    } else if (msg.includes("403") || msg.includes("Forbidden")) {
      userMessage = "Chave de API inválida ou sem permissão. Verifique GOOGLE_AI_API_KEY no .env.";
      status = 403;
    }

    return NextResponse.json({ ok: false, error: userMessage }, { status });
  }
}
