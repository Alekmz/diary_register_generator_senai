// Configuração dos PDFs de planos de curso
// Para adicionar novos planos, edite este arquivo

export interface PlanoCursoConfig {
  nome: string;
  arquivo: string;
  keywords: string[];
  descricao: string;
}

export const PLANOS_CURSO_CONFIG: PlanoCursoConfig[] = [
  {
    nome: "Adaptação SC - CT Desenvolvimento de Sistemas Presencial",
    arquivo: "Adaptação SC - CT Desenvolvimento de Sistemas Presencial.pdf",
    keywords: ["desenvolvimento", "sistemas", "presencial", "sc", "ct", "desenvolvimento de sistemas"],
    descricao: "Plano de curso para Desenvolvimento de Sistemas"
  },
  {
    nome: "Projeto de Curso_Informática para Internet 1000 SENAI SED",
    arquivo: "Projeto de Curso_Informática para Internet 1000 SENAI SED.pdf",
    keywords: ["informática", "internet", "senai", "sed", "1000", "informática para internet"],
    descricao: "Plano de curso para Informática para Internet"
  },
  {
    nome: "Projeto de Curso_Programação de Jogos Digitais 1000 SENAI SED",
    arquivo: "Projeto de Curso_Programação de Jogos Digitais 1000 SENAI SED.pdf",
    keywords: ["programação", "jogos", "digitais", "senai", "sed", "1000", "programação de jogos"],
    descricao: "Plano de curso para Programação de Jogos Digitais"
  }
];

export const METODOLOGIA_CONFIG = {
  nome: "arquivos_MSEP",
  arquivo: "arquivos_MSEP.pdf",
  keywords: ["metodologia", "msep", "ensino", "estratégias"],
  descricao: "Arquivo de metodologia e estratégias de ensino"
};
