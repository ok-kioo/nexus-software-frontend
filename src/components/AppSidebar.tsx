import { NexusLogoMark } from "@/components/NexusLogoMark";
import {
  LayoutDashboard, Bell, Users, BookOpen, GraduationCap, ShieldAlert,
  Upload, Download, Settings, LogOut, ClipboardList, UserCog, CalendarCheck, Mail, Database,
  Megaphone, Calendar as CalendarIcon, Target, Shield,
  HelpCircle, Search, ChevronsUpDown, User as UserIcon, Sun, Moon, Monitor,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import type { UserRole } from "@/data/mockData";
import { useAlertas } from "@/hooks/useAlertas";
import { SidebarImportIndicator } from "@/components/reusable/SidebarImportIndicator";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badgeKey?: "alertas";
  roles: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["administrador", "gestor"] },
      { title: "Alertas", url: "/alertas", icon: Bell, badgeKey: "alertas", roles: ["administrador", "gestor"] },
    ],
  },
  {
    label: "Acadêmico",
    items: [
      { title: "Matrículas", url: "/matriculas", icon: Users, roles: ["administrador", "gestor"] },
      { title: "Turmas", url: "/turmas", icon: BookOpen, roles: ["administrador", "gestor"] },
      { title: "Desempenho", url: "/academico", icon: GraduationCap, roles: ["administrador", "gestor"] },
      { title: "Permanência", url: "/permanencia", icon: ShieldAlert, roles: ["administrador", "gestor"] },
      { title: "Planos de Ação", url: "/planos-acao", icon: Target, roles: ["administrador", "gestor"] },
    ],
  },
  {
    label: "Sala de Aula",
    items: [
      { title: "Minhas Turmas", url: "/professor", icon: ClipboardList, roles: ["professor"] },
      { title: "Frequência", url: "/frequencia", icon: CalendarCheck, roles: ["professor"] },
      { title: "Notas", url: "/notas", icon: GraduationCap, roles: ["professor"] },
      { title: "Planos de Ação", url: "/planos-acao", icon: Target, roles: ["professor"] },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { title: "Mural", url: "/mural", icon: Megaphone, roles: ["administrador", "gestor", "professor"] },
      { title: "Calendário", url: "/calendario", icon: CalendarIcon, roles: ["administrador", "gestor", "professor"] },
    ],
  },
  {
    label: "Dados",
    items: [
      { title: "Cadastros", url: "/cadastros", icon: Database, roles: ["administrador", "gestor"] },
      { title: "Importar", url: "/importar", icon: Upload, roles: ["administrador", "gestor"] },
      { title: "Exportar", url: "/exportar", icon: Download, roles: ["administrador", "gestor"] },
    ],
  },
  {
    label: "Administração",
    items: [
      { title: "Usuários", url: "/usuarios", icon: UserCog, roles: ["administrador"] },
      { title: "Convites", url: "/convites", icon: Mail, roles: ["administrador", "gestor"] },
      { title: "Auditoria", url: "/auditoria", icon: Shield, roles: ["administrador"] },
    ],
  },
];

// Itens fixos do rodapé (sempre visíveis pelo menu do usuário e pela busca rápida)
const utilityItems: NavItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["administrador", "gestor", "professor"] },
  { title: "Ajuda", url: "/ajuda", icon: HelpCircle, roles: ["administrador", "gestor", "professor"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const { data: alertasAtivos } = useAlertas({ status: "ativo" });
  const alertCount = (alertasAtivos ?? []).filter((a) => a.severity !== "informativo").length;
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => role && item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);

  const visibleUtilities = utilityItems.filter((i) => role && i.roles.includes(role));
  const allRoutes = [
    ...visibleGroups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))),
    ...visibleUtilities.map((i) => ({ ...i, group: "Conta" })),
  ];

  // Atalho Cmd/Ctrl+K para abrir busca rápida
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (url: string) => {
    setCmdOpen(false);
    navigate(url);
  };

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
    <Sidebar collapsible="icon">
      <SidebarHeader className={`py-5 ${collapsed ? 'px-0 flex justify-center' : 'px-4'}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <NexusLogoMark className="w-8 h-8" />

          {!collapsed && (
            <div>
              <div className="font-bold text-sm text-foreground">
                <span className="text-primary">Nex</span>
                <span className="text-accent">us</span>
              </div>
              <div className="text-[10px] text-muted-foreground">Monitoramento Acadêmico</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Busca rápida (Cmd/Ctrl+K) */}
        <div className={`px-2 pt-2 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            aria-label="Buscar páginas"
            title="Buscar páginas (Ctrl/Cmd + K)"
            className={`group flex items-center rounded-md border border-border bg-muted/30 hover:bg-muted/60 transition-colors ${
              collapsed
                ? "h-8 w-8 justify-center p-0"
                : "w-full h-9 px-2 gap-2 text-xs text-muted-foreground"
            }`}
          >
            <Search className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Buscar…</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = location.pathname === item.url;
                  const tourKey = item.url.replace(/^\//, "");
                  return (
                    <SidebarMenuItem key={item.url} data-tour={`sidebar-${tourKey}`}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.url}
                          end
                          className={`relative transition-colors pl-4 ${active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                          activeClassName="text-primary font-medium"
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-accent" />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="ml-1">{item.title}</span>}
                          {!collapsed && item.badgeKey === "alertas" && alertCount > 0 && (
                            <Badge className="ml-auto bg-accent text-accent-foreground text-[10px] h-5 px-1.5">
                              {alertCount}
                            </Badge>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border">
        {!collapsed && <SidebarImportIndicator />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-2 w-full rounded-md p-2 hover:bg-muted/60 transition-colors text-left ${
                collapsed ? "justify-center" : ""
              }`}
              aria-label="Abrir menu da conta"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                {initials}
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{user?.name || "Usuário"}</div>
                    <div className="text-[11px] text-muted-foreground capitalize truncate">{role || "—"}</div>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm">{user?.name || "Usuário"}</span>
              <span className="text-[11px] text-muted-foreground font-normal truncate">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {visibleUtilities.map((item) => (
              <DropdownMenuItem key={item.url} onClick={() => navigate(item.url)}>
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {mode === "light" ? <Sun className="h-4 w-4 mr-2" /> : mode === "dark" ? <Moon className="h-4 w-4 mr-2" /> : <Monitor className="h-4 w-4 mr-2" />}
                Tema
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as "light" | "dark" | "auto")}>
                  <DropdownMenuRadioItem value="light"><Sun className="h-4 w-4 mr-2" />Claro</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark"><Moon className="h-4 w-4 mr-2" />Escuro</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="auto"><Monitor className="h-4 w-4 mr-2" />Sistema</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>

    {/* Command palette: busca rápida de páginas */}
    <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
      <CommandInput placeholder="Buscar página, ação ou seção…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        {visibleGroups.map((g) => (
          <CommandGroup key={g.label} heading={g.label}>
            {g.items.map((item) => (
              <CommandItem key={item.url} value={`${g.label} ${item.title}`} onSelect={() => go(item.url)}>
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {visibleUtilities.length > 0 && (
          <CommandGroup heading="Conta">
            {visibleUtilities.map((item) => (
              <CommandItem key={item.url} value={`Conta ${item.title}`} onSelect={() => go(item.url)}>
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </CommandItem>
            ))}
            <CommandItem value="Sair" onSelect={() => { setCmdOpen(false); handleLogout(); }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
    </>
  );
}
