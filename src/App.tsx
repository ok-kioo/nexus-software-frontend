import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImportJobProvider } from "@/contexts/ImportJobContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AceitarConvite from "@/pages/AceitarConvite";
import EsqueciSenha from "@/pages/EsqueciSenha";
import RedefinirSenha from "@/pages/RedefinirSenha";
import Convites from "@/pages/Convites";
import Dashboard from "@/pages/Dashboard";
import Cadastros from "@/pages/Cadastros";
import Alertas from "@/pages/Alertas";
import Matriculas from "@/pages/Matriculas";
import Turmas from "@/pages/Turmas";
import Academico from "@/pages/Academico";
import Permanencia from "@/pages/Permanencia";
import Importar from "@/pages/Importar";
import Exportar from "@/pages/Exportar";
import Configuracoes from "@/pages/Configuracoes";
import Professor from "@/pages/Professor";
import Frequencia from "@/pages/Frequencia";
import Notas from "@/pages/Notas";
import Usuarios from "@/pages/Usuarios";
import NotFound from "@/pages/NotFound";
import AlunoPerfil from "@/pages/AlunoPerfil";
import Mural from "@/pages/Mural";
import Calendario from "@/pages/Calendario";
import PlanosAcao from "@/pages/PlanosAcao";
import Auditoria from "@/pages/Auditoria";
import TurmaRelatorio from "@/pages/TurmaRelatorio";
import Ajuda from "@/pages/Ajuda";
import DevConviteCenarios from "@/pages/DevConviteCenarios";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ImportJobProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/aceitar-convite" element={<AceitarConvite />} />
              <Route path="/esqueci-senha" element={<EsqueciSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Dashboard /></ProtectedRoute>} />
                <Route path="alertas" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Alertas /></ProtectedRoute>} />
                <Route path="matriculas" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Matriculas /></ProtectedRoute>} />
                <Route path="turmas" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Turmas /></ProtectedRoute>} />
                <Route path="cadastros" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Cadastros /></ProtectedRoute>} />
                <Route path="academico" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Academico /></ProtectedRoute>} />
                <Route path="permanencia" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Permanencia /></ProtectedRoute>} />
                <Route path="importar" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Importar /></ProtectedRoute>} />
                <Route path="exportar" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Exportar /></ProtectedRoute>} />
                <Route path="configuracoes" element={<ProtectedRoute allowedRoles={["administrador", "gestor", "professor"]}><Configuracoes /></ProtectedRoute>} />
                <Route path="usuarios" element={<ProtectedRoute allowedRoles={["administrador"]}><Usuarios /></ProtectedRoute>} />
                <Route path="convites" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><Convites /></ProtectedRoute>} />
                <Route path="professor" element={<ProtectedRoute allowedRoles={["professor"]}><Professor /></ProtectedRoute>} />
                <Route path="frequencia" element={<ProtectedRoute allowedRoles={["professor"]}><Frequencia /></ProtectedRoute>} />
                <Route path="notas" element={<ProtectedRoute allowedRoles={["professor"]}><Notas /></ProtectedRoute>} />
                <Route path="alunos/:id" element={<ProtectedRoute allowedRoles={["administrador", "gestor", "professor"]}><AlunoPerfil /></ProtectedRoute>} />
                <Route path="turmas/:id/relatorio" element={<ProtectedRoute allowedRoles={["administrador", "gestor"]}><TurmaRelatorio /></ProtectedRoute>} />
                <Route path="mural" element={<ProtectedRoute><Mural /></ProtectedRoute>} />
                <Route path="calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
                <Route path="planos-acao" element={<ProtectedRoute allowedRoles={["administrador", "gestor", "professor"]}><PlanosAcao /></ProtectedRoute>} />
                <Route path="auditoria" element={<ProtectedRoute allowedRoles={["administrador"]}><Auditoria /></ProtectedRoute>} />
                <Route path="ajuda" element={<ProtectedRoute><Ajuda /></ProtectedRoute>} />
                <Route path="dev/convite-cenarios" element={<ProtectedRoute allowedRoles={["administrador"]}><DevConviteCenarios /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </ImportJobProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
