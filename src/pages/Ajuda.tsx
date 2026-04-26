import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Bell, Users, BookOpen, GraduationCap, ShieldAlert,
  Upload, Download, Settings, ClipboardList, UserCog, CalendarCheck, Mail, Database,
  Megaphone, Calendar as CalendarIcon, Target, Shield, HelpCircle, Search,
  Lightbulb, KeyRound, FileSpreadsheet, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/data/mockData";

type Audience = UserRole | "todos";

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route?: string;
  audience: Audience[];
  steps: string[];
  tips?: string[];
}

const sections: GuideSection[] = [
  {
    id: "dashboard",
    title: "Dashboard (Visão Geral)",
    description: "Painel inicial com indicadores consolidados de matrículas, frequência, notas e alertas.",
    icon: LayoutDashboard,
    route: "/dashboard",
    audience: ["administrador", "gestor"],
    steps: [
      "Acesse 'Dashboard' no menu lateral para ver KPIs gerais.",
      "Use os filtros do topo (unidade, período) para refinar os indicadores.",
      "Clique em um cartão para navegar até o relatório detalhado.",
    ],
    tips: ["Os dados são atualizados conforme novas importações."],
  },
  {
    id: "alertas",
    title: "Alertas",
    description: "Sinais automáticos sobre risco de evasão, baixa frequência e queda de desempenho.",
    icon: Bell,
    route: "/alertas",
    audience: ["administrador", "gestor"],
    steps: [
      "Cada alerta possui severidade (crítico, atenção, informativo).",
      "Clique em um alerta para ver o aluno/turma envolvido.",
      "A partir do alerta você pode criar um Plano de Ação.",
    ],
  },
  {
    id: "matriculas",
    title: "Matrículas",
    description: "Gestão das matrículas ativas, transferências e cancelamentos.",
    icon: Users,
    route: "/matriculas",
    audience: ["administrador", "gestor"],
    steps: [
      "Filtre por status, turma ou período.",
      "Use a busca por nome (com debounce) para localizar rapidamente.",
      "Crie novas matrículas vinculando aluno e turma existentes.",
    ],
  },
  {
    id: "turmas",
    title: "Turmas",
    description: "Listagem de turmas com ocupação, professores responsáveis e relatório individual.",
    icon: BookOpen,
    route: "/turmas",
    audience: ["administrador", "gestor"],
    steps: [
      "A barra de ocupação muda de cor conforme a lotação da turma.",
      "Clique em 'Relatório' para ver indicadores detalhados da turma.",
    ],
  },
  {
    id: "academico",
    title: "Acadêmico",
    description: "Indicadores de aprovação, recuperação e desempenho por turma e curso.",
    icon: GraduationCap,
    route: "/academico",
    audience: ["administrador", "gestor"],
    steps: ["Compare turmas usando os filtros de unidade e curso."],
  },
  {
    id: "permanencia",
    title: "Permanência",
    description: "Análise de retenção e risco de evasão por aluno.",
    icon: ShieldAlert,
    route: "/permanencia",
    audience: ["administrador", "gestor"],
    steps: ["Identifique alunos em risco e gere planos de ação direto da página."],
  },
  {
    id: "cadastros",
    title: "Cadastros",
    description: "CRUD de Unidades, Cursos, Turmas, Alunos e Matrículas.",
    icon: Database,
    route: "/cadastros",
    audience: ["administrador", "gestor"],
    steps: [
      "Use as abas para alternar entre as entidades.",
      "Cada listagem tem busca, filtros e paginação (20 por página).",
      "Antes de excluir um registro, confirme o impacto em registros relacionados.",
    ],
  },
  {
    id: "professor",
    title: "Minhas Turmas (Professor)",
    description: "Visão personalizada das turmas atribuídas ao professor.",
    icon: ClipboardList,
    route: "/professor",
    audience: ["professor"],
    steps: ["Selecione uma turma para acessar Frequência ou Notas."],
  },
  {
    id: "frequencia",
    title: "Frequência",
    description: "Registro diário de presença dos alunos da turma.",
    icon: CalendarCheck,
    route: "/frequencia",
    audience: ["professor"],
    steps: [
      "A frequência só pode ser registrada na data atual.",
      "Marque presentes/ausentes e salve antes de sair da página.",
    ],
  },
  {
    id: "notas",
    title: "Notas",
    description: "Lançamento e edição de notas por aluno e período.",
    icon: GraduationCap,
    route: "/notas",
    audience: ["professor"],
    steps: ["Edite as notas direto na tabela e salve em lote."],
  },
  {
    id: "mural",
    title: "Mural",
    description: "Avisos e comunicados para a comunidade escolar.",
    icon: Megaphone,
    route: "/mural",
    audience: ["administrador", "gestor", "professor"],
    steps: ["Avisos fixados aparecem no topo. Marque como lido após visualizar."],
  },
  {
    id: "calendario",
    title: "Calendário",
    description: "Eventos acadêmicos, reuniões e datas importantes.",
    icon: CalendarIcon,
    route: "/calendario",
    audience: ["administrador", "gestor", "professor"],
    steps: ["Clique em uma data para ver os eventos do dia."],
  },
  {
    id: "planos-acao",
    title: "Planos de Ação",
    description: "Acompanhamento de intervenções pedagógicas para alunos em risco.",
    icon: Target,
    route: "/planos-acao",
    audience: ["administrador", "gestor", "professor"],
    steps: [
      "Crie planos a partir de um aluno ou de um alerta.",
      "Defina prazo, responsável e prioridade.",
      "Atualize o status conforme o plano avança.",
    ],
  },
  {
    id: "importar",
    title: "Importar",
    description: "Carga de dados via planilha Excel padronizada — processamento em background com lotes paralelos.",
    icon: Upload,
    route: "/importar",
    audience: ["administrador", "gestor"],
    steps: [
      "Na primeira importação, envie a base completa (7 abas).",
      "Depois é possível importar abas individualmente.",
      "Erros de validação são exibidos linha a linha.",
      "Use 'Enviar para servidor (assíncrono)' para arquivos grandes: o upload retorna imediatamente e o processamento continua em segundo plano.",
      "O servidor divide o arquivo em lotes (chunks) e processa vários lotes em paralelo, acelerando importações com milhares de linhas.",
      "Acompanhe o progresso pelo cartão de status no topo da página ou pelo indicador no menu lateral — você pode navegar para outras telas enquanto roda.",
    ],
    tips: [
      "Baixe o modelo Excel oficial: ele já vem com a aba 'Instruções', cabeçalhos formatados e uma linha de exemplo realista por entidade.",
      "Importações em background sobrevivem a F5 e troca de página — só não feche a aba antes do upload terminar.",
    ],
  },
  {
    id: "exportar",
    title: "Exportar",
    description: "Geração de relatórios em PDF e Excel.",
    icon: Download,
    route: "/exportar",
    audience: ["administrador", "gestor"],
    steps: ["Escolha o relatório, aplique filtros e clique em 'Exportar'."],
  },
  {
    id: "usuarios",
    title: "Usuários",
    description: "Gerenciamento de contas e papéis (somente administradores).",
    icon: UserCog,
    route: "/usuarios",
    audience: ["administrador"],
    steps: ["Atribua papéis com cuidado: cada papel tem permissões diferentes."],
  },
  {
    id: "convites",
    title: "Convites",
    description: "Envio de convites por e-mail para novos usuários.",
    icon: Mail,
    route: "/convites",
    audience: ["administrador", "gestor"],
    steps: [
      "Informe e-mail, papel e turmas (para professores).",
      "O convidado recebe um link de aceite válido por tempo limitado.",
    ],
  },
  {
    id: "auditoria",
    title: "Auditoria",
    description: "Histórico de alterações sensíveis no sistema.",
    icon: Shield,
    route: "/auditoria",
    audience: ["administrador"],
    steps: ["Filtre por entidade, ação ou usuário para investigar mudanças."],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Preferências pessoais: tema, notificações e senha.",
    icon: Settings,
    route: "/configuracoes",
    audience: ["administrador", "gestor", "professor"],
    steps: ["Alterne entre tema claro/escuro e atualize sua senha quando necessário."],
  },
];

const faqs = [
  {
    q: "Como recupero minha senha?",
    a: "Na tela de login clique em 'Esqueci minha senha', informe seu e-mail e siga o link recebido.",
  },
  {
    q: "Por que algumas opções do menu não aparecem para mim?",
    a: "O menu é filtrado pelo seu papel (Administrador, Gestor ou Professor). Apenas as funcionalidades permitidas são exibidas.",
  },
  {
    q: "Posso editar dados importados?",
    a: "Sim, dados de Unidades, Cursos, Turmas, Alunos e Matrículas podem ser editados em 'Cadastros'.",
  },
  {
    q: "Como crio um Plano de Ação a partir de um alerta?",
    a: "Em 'Alertas', abra o alerta desejado e clique em 'Criar plano de ação'. As informações do aluno são pré-preenchidas.",
  },
  {
    q: "Por que a importação falhou?",
    a: "Verifique se todas as abas obrigatórias estão preenchidas e se os campos seguem o formato do modelo. Os erros são detalhados após o envio.",
  },
  {
    q: "Os dados são atualizados em tempo real?",
    a: "A maioria dos indicadores é recalculada após cada importação ou ação manual. Recarregue a página caso não veja mudanças imediatas.",
  },
];

export default function Ajuda() {
  const { role } = useAuth();
  const [query, setQuery] = useState("");

  const visibleSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections.filter((s) => {
      const allowed = !role || s.audience.includes("todos") || s.audience.includes(role);
      if (!allowed) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.steps.some((st) => st.toLowerCase().includes(q))
      );
    });
  }, [query, role]);

  const visibleFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <PageHeader
        title="Central de Ajuda"
        subtitle="Aprenda a usar a Nexus e tire dúvidas sobre cada funcionalidade."
      />

      {role === "administrador" && (
        <p className="text-xs text-muted-foreground mb-4">
          Ferramenta de QA:{" "}
          <a href="/dev/convite-cenarios" className="text-primary hover:underline">
            cenários de convite
          </a>{" "}
          (visível apenas para administradores).
        </p>
      )}

      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por funcionalidade, passo ou dúvida..."
          className="pl-9"
          aria-label="Buscar na ajuda"
        />
      </div>

      <Tabs defaultValue="guia" className="w-full">
        <TabsList>
          <TabsTrigger value="guia">
            <Lightbulb className="h-4 w-4 mr-1.5" />
            Guia da plataforma
          </TabsTrigger>
          <TabsTrigger value="primeiros-passos">
            <KeyRound className="h-4 w-4 mr-1.5" />
            Primeiros passos
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-1.5" />
            Perguntas frequentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guia" className="mt-6">
          {visibleSections.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado para "{query}".
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleSections.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{s.title}</CardTitle>
                          <CardDescription className="mt-1">{s.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3">
                      <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground/90">
                        {s.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      {s.tips && s.tips.length > 0 && (
                        <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground flex gap-2">
                          <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          <div>{s.tips.join(" ")}</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-wrap gap-1">
                          {s.audience.map((a) => (
                            <Badge key={a} variant="secondary" className="text-[10px] capitalize">
                              {a}
                            </Badge>
                          ))}
                        </div>
                        {s.route && (
                          <Link
                            to={s.route}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Abrir página →
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="primeiros-passos" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <KeyRound className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">1. Acesse sua conta</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Faça login com o e-mail cadastrado. Caso tenha recebido um convite, clique no link e defina sua senha.</p>
                <p>Se esqueceu a senha, use 'Esqueci minha senha' na tela de login.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">2. Importe seus dados</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Na primeira utilização, vá em <Link to="/importar" className="text-primary hover:underline">Importar</Link> e envie a planilha completa com as 7 abas.</p>
                <p>Em importações futuras, é possível enviar abas individualmente.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">3. Explore os indicadores</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Use o <Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link> para visão geral, <Link to="/alertas" className="text-primary hover:underline">Alertas</Link> para riscos e <Link to="/planos-acao" className="text-primary hover:underline">Planos de Ação</Link> para intervenções.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-accent/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent" />
                <CardTitle className="text-base">Boas práticas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1.5">
              <p>• Mantenha as importações periódicas para indicadores sempre atualizados.</p>
              <p>• Revise alertas críticos diariamente e gere planos de ação quando necessário.</p>
              <p>• Convide professores apenas para as turmas que efetivamente lecionam.</p>
              <p>• Use a Auditoria para rastrear alterações sensíveis em cadastros.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          {visibleFaqs.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma pergunta encontrada para "{query}".
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {visibleFaqs.map((f, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-left text-sm font-medium">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}