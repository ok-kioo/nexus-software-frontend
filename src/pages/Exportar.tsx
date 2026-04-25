import { useEffect, useState } from "react";
import { Download, FileText, Table as TableIcon, FileSpreadsheet, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  collectSections, generatePDF, generateExcel, generateCSV,
  formatBytes, type SectionId, type ExportFormat,
} from "@/lib/exportacao/relatorios";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "matriculas", label: "Matrículas" },
  { id: "turmas", label: "Turmas" },
  { id: "academico", label: "Acadêmico" },
  { id: "permanencia", label: "Permanência" },
];

const HISTORY_KEY = "nexus-export-history";

interface HistoryEntry {
  file: string;
  date: string;
  format: ExportFormat;
  sections: number;
  size: string;
}

export default function Exportar() {
  const [selected, setSelected] = useState<SectionId[]>(["matriculas"]);
  const [format, setFormat] = useState<ExportFormat>("PDF");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  const toggle = (id: SectionId) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const pushHistory = (entry: HistoryEntry) => {
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const handleExport = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const datasets = await collectSections(selected);
      const totalRows = datasets.reduce((acc, d) => acc + d.rows.length, 0);
      const result =
        format === "PDF" ? generatePDF(datasets) :
        format === "Excel" ? generateExcel(datasets) :
        generateCSV(datasets);

      pushHistory({
        file: result.filename,
        date: new Date().toLocaleString("pt-BR"),
        format,
        sections: selected.length,
        size: formatBytes(result.size),
      });

      toast.success("Relatório gerado com sucesso", {
        description: `${selected.length} seção(ões) · ${totalRows} registro(s) · ${formatBytes(result.size)}`,
      });
    } catch (e: any) {
      toast.error("Falha ao gerar relatório", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Exportar Relatórios" subtitle="Gere relatórios em PDF, Excel ou CSV a partir dos dados reais" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Seções do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {SECTIONS.map((s) => (
                  <Label
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors font-normal"
                  >
                    <Checkbox
                      checked={selected.includes(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                    />
                    <span className="text-sm text-foreground">{s.label}</span>
                  </Label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Format toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Formato</CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleGroup type="single" value={format} onValueChange={(v) => v && setFormat(v as ExportFormat)} className="justify-start">
                <ToggleGroupItem value="PDF" aria-label="PDF" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <FileText className="h-4 w-4" /> PDF
                </ToggleGroupItem>
                <ToggleGroupItem value="Excel" aria-label="Excel" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </ToggleGroupItem>
                <ToggleGroupItem value="CSV" aria-label="CSV" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TableIcon className="h-4 w-4" /> CSV
                </ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>
        </div>

        {/* Right: preview summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo da Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seções:</span>
                  <span className="text-foreground font-medium">{selected.length} selecionada(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formato:</span>
                  <span className="text-foreground font-medium">{format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Origem:</span>
                  <span className="text-foreground font-medium">Banco real</span>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={handleExport}
                disabled={selected.length === 0 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                {loading ? "Gerando…" : "Exportar Relatório"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico de Exportações (local)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Seções</TableHead>
                <TableHead>Tamanho</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum relatório gerado ainda. Use o botão acima para começar.
                  </TableCell>
                </TableRow>
              ) : history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{h.file}</TableCell>
                  <TableCell className="text-muted-foreground">{h.date}</TableCell>
                  <TableCell><Badge variant="outline">{h.format}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{h.sections}</TableCell>
                  <TableCell className="text-muted-foreground">{h.size}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
