import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Captura erros de render de qualquer descendente para evitar a temida tela em branco.
 * Sem este boundary, um throw silencioso dentro do <Outlet/> deixa o DOM montado
 * porém sem conteúdo visível.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto border-destructive/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">Algo deu errado ao renderizar esta página</CardTitle>
                <CardDescription className="mt-1">
                  Você pode tentar recarregar. Se o problema persistir, abra um chamado com a mensagem abaixo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Detalhes técnicos</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted/60 p-3 text-foreground/80">
                {error.message}
                {error.stack ? `\n\n${error.stack}` : ""}
              </pre>
            </details>
            <div className="flex gap-2">
              <Button onClick={this.reset} variant="default" size="sm">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Tentar novamente
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Recarregar página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
