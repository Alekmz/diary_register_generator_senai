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
    return NextResponse.json({ 
      ok: false, 
      error: err?.message ?? "Erro interno" 
    }, { status: 500 });
  }
}
