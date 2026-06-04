import { useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserPlus,
  ClipboardList,
  CalendarCheck,
  GraduationCap,
  FileSpreadsheet,
  LayoutDashboard,
  FileBarChart,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Mail,
  TrendingUp,
  Activity,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Usuários e permissões",
    desc: "Controle de acesso por perfil (administrador, gestor, professor) com regras claras por unidade.",
    accent: false,
  },
  {
    icon: UserPlus,
    title: "Cadastros centralizados",
    desc: "Alunos, professores, cursos e turmas em um único lugar, com busca rápida e edição completa.",
    accent: true,
  },
  {
    icon: ClipboardList,
    title: "Matrículas inteligentes",
    desc: "Vincule alunos a turmas em poucos cliques, com validações automáticas e histórico.",
    accent: false,
  },
  {
    icon: CalendarCheck,
    title: "Controle de frequência",
    desc: "Lançamento diário pelo professor, com bloqueio para datas futuras e auditoria completa.",
    accent: false,
  },
  {
    icon: GraduationCap,
    title: "Notas e avaliações",
    desc: "Lançamento e acompanhamento de notas por bimestre, com indicadores de risco.",
    accent: true,
  },
  {
    icon: FileSpreadsheet,
    title: "Importação via Excel",
    desc: "Suba planilhas e o Nexus valida, organiza e importa em lotes — com tolerância a duplicados.",
    accent: false,
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard administrativo",
    desc: "Visão consolidada de unidades, ocupação de turmas, alertas e tendências em tempo real.",
    accent: false,
  },
  {
    icon: FileBarChart,
    title: "Relatórios acadêmicos",
    desc: "Exportação em PDF e Excel para reuniões, conselhos de classe e prestação de contas.",
    accent: true,
  },
  {
    icon: ShieldCheck,
    title: "Segurança por design",
    desc: "Autenticação robusta, papéis isolados e auditoria de operações críticas.",
    accent: false,
  },
];

const differentials = [
  "Interface moderna e intuitiva, pensada para o dia a dia educacional",
  "Reduz retrabalho operacional e elimina planilhas paralelas",
  "Automatiza processos acadêmicos críticos do início ao fim",
  "Segurança de dados e controle granular por papel de usuário",
  "Administração centralizada com visão por unidade e por curso",
  "Escalável de uma única escola até redes com várias unidades",
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const toggleTheme = () => setMode(theme === "dark" ? "light" : "dark");

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    toast({
      title: "Mensagem registrada",
      description:
        "Em breve entraremos em contato. Você também pode escrever para admin@nexus.com.",
    });
    form.reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="#top" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              N
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">Nex</span>
              <span className="text-accent">us</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#funcionalidades" className="transition-colors hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#diferenciais" className="transition-colors hover:text-foreground">
              Diferenciais
            </a>
            <a href="#contato" className="transition-colors hover:text-foreground">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <a href="#contato">Solicitar demo</a>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-1/3 -left-1/4 h-[60%] w-[60%] rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-1/3 -right-1/4 h-[60%] w-[60%] rounded-full bg-accent/10 blur-3xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/5 blur-3xl animate-pulse"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Plataforma de gestão educacional
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Gestão educacional{" "}
                <span className="text-primary">completa</span>,
                <br className="hidden sm:block" /> moderna e{" "}
                <span className="text-accent">inteligente</span>.
              </h1>

              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                O Nexus reúne alunos, turmas, frequência, notas e relatórios em uma
                única plataforma — pronta para escolas e redes que querem decisão
                rápida, segurança e organização real.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 px-6">
                  <a href="#contato">
                    Solicitar demonstração <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6">
                  <a href="#funcionalidades">Conhecer funcionalidades</a>
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  Onboarding guiado
                </div>
              </div>
            </div>

            {/* Mockup card */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: "120ms" }}>
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl" />
              <Card className="relative shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Visão geral
                      </p>
                      <p className="text-lg font-semibold">Painel acadêmico</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      { label: "Alunos", value: "1.284", icon: Users },
                      { label: "Turmas", value: "62", icon: GraduationCap },
                      { label: "Frequência", value: "94%", icon: Activity },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <s.icon className="h-4 w-4 text-muted-foreground" />
                        <p className="mt-2 text-xl font-bold">{s.value}</p>
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      { name: "9º ano A", val: 92, tone: "bg-primary" },
                      { name: "8º ano B", val: 78, tone: "bg-accent" },
                      { name: "7º ano C", val: 65, tone: "bg-secondary" },
                    ].map((row) => (
                      <div key={row.name}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium">{row.name}</span>
                          <span className="text-muted-foreground">{row.val}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${row.tone}`}
                            style={{ width: `${row.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-muted-foreground">
                      Tendência positiva nas últimas 4 semanas
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="border-t border-border py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Funcionalidades
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo o que sua instituição precisa, num só lugar
            </h2>
            <p className="mt-4 text-muted-foreground">
              Um conjunto completo de ferramentas para a rotina acadêmica, do cadastro
              ao relatório final.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="group transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        f.accent
                          ? "bg-accent/10 text-accent"
                          : "bg-primary/10 text-primary"
                      } transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {f.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="border-t border-border bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Diferenciais
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Construído para fazer a diferença na sua operação
              </h2>
              <p className="mt-5 text-muted-foreground">
                O Nexus combina design moderno, automação acadêmica e segurança de
                nível corporativo para transformar a forma como sua instituição
                trabalha — sem complicar.
              </p>
              <div className="mt-8 hidden lg:block">
                <Button asChild size="lg" className="h-12 px-6">
                  <a href="#contato">
                    Quero conhecer <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <ul className="space-y-4">
              {differentials.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="border-t border-border py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Contato
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Vamos conversar sobre o seu projeto
              </h2>
              <p className="mt-4 text-muted-foreground">
                Conte um pouco sobre sua instituição. Em breve nossa equipe entra em
                contato com uma proposta sob medida.
              </p>
            </div>

            <Card className="mt-10 shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        name="nome"
                        placeholder="Seu nome completo"
                        className="mt-1.5 h-11 bg-muted/30"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="voce@instituicao.com"
                        className="mt-1.5 h-11 bg-muted/30"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea
                      id="mensagem"
                      name="mensagem"
                      placeholder="Conte um pouco sobre sua instituição e o que você procura."
                      className="mt-1.5 min-h-[140px] bg-muted/30"
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-12">
                    Enviar mensagem
                  </Button>
                </form>

                <Separator className="my-6" />

                <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Prefere e-mail direto?{" "}
                  <a
                    href="mailto:admin@nexus.com"
                    className="font-medium text-primary hover:underline"
                  >
                    admin@nexus.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  N
                </div>
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-primary">Nex</span>
                  <span className="text-accent">us</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Plataforma independente de gestão e monitoramento acadêmico para
                instituições de ensino.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Plataforma</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#funcionalidades" className="hover:text-foreground">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#diferenciais" className="hover:text-foreground">
                    Diferenciais
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Contato</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:admin@nexus.com"
                    className="hover:text-foreground"
                  >
                    admin@nexus.com
                  </a>
                </li>
                <li>
                  <a href="#contato" className="hover:text-foreground">
                    Solicitar demonstração
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Nexus. Todos os direitos reservados.</p>
            <p>Feito com cuidado para a educação.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
