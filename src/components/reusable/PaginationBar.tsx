import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function PaginationBar({ page, pageSize, total, onPageChange, loading }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 px-1">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {total === 0
          ? "Nenhum registro"
          : <>Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de <span className="font-medium text-foreground">{total}</span> registro{total === 1 ? "" : "s"}</>}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1 || loading} onClick={() => onPageChange(1)} aria-label="Primeira página">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2 whitespace-nowrap">
          Página <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{totalPages}</span>
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} aria-label="Próxima página">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages || loading} onClick={() => onPageChange(totalPages)} aria-label="Última página">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}