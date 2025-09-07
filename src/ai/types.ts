import { z } from "zod";

export const OutputSchema = z.object({
  titulo: z.string(),
  descricao_original: z.string(),
  descricao_melhorada: z.string(),
  atividades: z.string(),
  estrategiaEnsino: z.string(),
  curso: z.string(),
  unidadeCurricular: z.string(),
  capacidadesUC_todas: z.union([z.array(z.string().min(1)), z.literal("não localizado nos PDFs")]),
  capacidadesUC_selecionadas: z.union([z.array(z.string().min(1)), z.literal("não localizado nos PDFs")]),
  observacoes: z.array(z.string()).default([])
});

export type OutputDTO = z.infer<typeof OutputSchema>;

export type FormInput = {
  tema: string;
  descricao: string;
  atividades: string;
  estrategiaEnsino: string;
  planoDeCurso: string;      // nome exato do plano/curso
  unidadeCurricular: string; // nome exato da UC
};
