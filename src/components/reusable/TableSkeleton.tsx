import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
}

/**
 * Consistent table skeleton used across all CRUD/list pages.
 * Renders a real <Table> shell with shimmering cells so the layout
 * does not jump when data arrives.
 */
export function TableSkeleton({ columns = 5, rows = 6, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="animate-fade-in">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-3.5 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r} className="border-border">
              {Array.from({ length: columns }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton
                    className="h-4"
                    style={{ width: `${50 + ((r * 13 + c * 7) % 40)}%` }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Card-grid skeleton for occupancy cards, KPI grids, etc.
 */
export function CardGridSkeleton({ count = 8, height = 120 }: { count?: number; height?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="rounded-lg" style={{ height }} />
      ))}
    </div>
  );
}