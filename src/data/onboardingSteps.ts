import {
  Sparkles,
  FileSpreadsheet,
  Database,
  Mail,
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Compass,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/data/mockData";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  /** Rota onde o passo é executado. Se ausente, o passo roda na rota atual. */
  route?: string;
  /** CTA exibido no checklist (botão "Ir para…"). */
  ctaLabel: string;
  icon: LucideIcon;
  /** Seletor CSS do elemento a destacar no tour guiado. Se ausente ou inexistente, o passo vira "centro de tela". */
  target?: string;
  /** Posicionamento do balão do Joyride. */
  placement?: "top" | "bottom" | "left" | "right" | "center" | "auto";
  /** Permite clicar no elemento destacado para avançar a interação. */
  spotlightClicks?: boolean;
}

const adminGestorSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Nexus",
    description:
      "Vou te mostrar onde ficam as principais áreas que você precisa para começar: importar dados, revisar cadastros, convidar a equipe e acompanhar indicadores.",
    ctaLabel: "Começar",
    icon: Sparkles,
    placement: "center",
  },
  {
    id: "sidebar-importar",
    title: "Por aqui você importa dados",
    description:
      "Pelo menu lateral, 'Importar' é o ponto de entrada da planilha modelo com unidades, cursos, turmas, alunos, matrículas, frequência e notas.",
    ctaLabel: "Ir para Importar",
    icon: FileSpreadsheet,
    target: '[data-tour="sidebar-importar"]',
    placement: "right",
  },
  {
    id: "import-template",
    title: "Conheça o modelo de planilha",
    description:
      "Aqui fica o modelo oficial, com a aba 'Instruções', cabeçalhos formatados e exemplos. Você pode baixar quando estiver pronto para importar.",
    route: "/importar",
    ctaLabel: "Abrir Importar",
    icon: FileSpreadsheet,
    target: '[data-tour="import-download-template"]',
    placement: "bottom",
  },
  {
    id: "import-upload",
    title: "Área de envio da planilha",
    description:
      "Esta é a área onde você envia o arquivo preenchido. O processamento roda em segundo plano — dá para navegar enquanto importa.",
    route: "/importar",
    ctaLabel: "Abrir Importar",
    icon: FileSpreadsheet,
    target: '[data-tour="import-upload-area"]',
    placement: "top",
  },
  {
    id: "cadastros",
    title: "Onde revisar os cadastros",
    description:
      "Em 'Cadastros' você consulta e ajusta unidades, cursos, turmas, alunos e matrículas. As abas alternam entre as entidades.",
    route: "/cadastros",
    ctaLabel: "Abrir Cadastros",
    icon: Database,
    target: '[data-tour="cadastros-tabs"]',
    placement: "bottom",
  },
  {
    id: "convites",
    title: "Onde convidar sua equipe",
    description:
      "Em 'Convites' você gerencia o acesso de gestores e professores por e-mail. Para professores, é possível vincular as turmas que lecionam.",
    route: "/convites",
    ctaLabel: "Abrir Convites",
    icon: Mail,
    target: '[data-tour="convites-novo"]',
    placement: "bottom",
  },
  {
    id: "dashboard",
    title: "Visão geral pelo Dashboard",
    description:
      "O Dashboard reúne KPIs gerais e dá acesso rápido aos Alertas — sinais automáticos de evasão, frequência baixa e queda de desempenho.",
    route: "/dashboard",
    ctaLabel: "Abrir Dashboard",
    icon: LayoutDashboard,
    target: '[data-tour="dashboard-kpis"]',
    placement: "bottom",
  },
];

const professorSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo, professor(a)",
    description:
      "Vou te mostrar em poucos passos onde acessar suas turmas, lançar a frequência do dia e registrar notas.",
    ctaLabel: "Começar",
    icon: Sparkles,
    placement: "center",
  },
  {
    id: "sidebar-professor",
    title: "Suas turmas ficam aqui",
    description:
      "No menu lateral, 'Minhas Turmas' reúne todas as turmas atribuídas a você, com atalho para Frequência e Notas.",
    ctaLabel: "Abrir Minhas Turmas",
    icon: BookOpen,
    target: '[data-tour="sidebar-professor"]',
    placement: "right",
  },
  {
    id: "professor-turmas",
    title: "Suas turmas atribuídas",
    description:
      "Cada cartão mostra a turma, curso e contagem de alunos ativos. Os botões levam para Frequência ou Notas daquela turma.",
    route: "/professor",
    ctaLabel: "Abrir Minhas Turmas",
    icon: Compass,
    target: '[data-tour="professor-turmas"]',
    placement: "top",
  },
  {
    id: "frequencia",
    title: "Onde lançar a frequência",
    description:
      "Esta é a área de Frequência — sempre referente à data atual. Aqui você marca presença ou ausência dos alunos da turma selecionada.",
    route: "/frequencia",
    ctaLabel: "Abrir Frequência",
    icon: ClipboardCheck,
    target: '[data-tour="frequencia-lista"]',
    placement: "top",
  },
  {
    id: "notas",
    title: "Onde lançar e editar notas",
    description:
      "Em Notas você edita os valores direto na tabela e salva todas as alterações de uma vez quando estiver pronto.",
    route: "/notas",
    ctaLabel: "Abrir Notas",
    icon: GraduationCap,
    target: '[data-tour="notas-tabela"]',
    placement: "top",
  },
];

export function getStepsForRole(role: UserRole | null | undefined): OnboardingStep[] {
  if (role === "professor") return professorSteps;
  if (role === "administrador") return adminGestorSteps;
  if (role === "gestor") return adminGestorSteps.filter((s) => s.id !== "convites");
  return [];
}
