import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  type?: "bar" | "line" | "table";
  rows?: number;
}

export function ChartSkeleton({ type = "bar", rows = 5 }: ChartSkeletonProps) {
  if (type === "table") {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-full bg-primary/5" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-muted/60" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  }

  if (type === "line") {
    return (
      <div className="flex items-end gap-1 h-48 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <Skeleton
              className="w-full rounded-sm bg-primary/10"
              style={{ height: `${30 + Math.sin(i * 0.8) * 40 + 30}%`, animationDelay: `${i * 0.08}s` }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 h-48 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton
            className="w-full rounded-t bg-primary/10"
            style={{ height: `${40 + Math.random() * 50}%`, animationDelay: `${i * 0.1}s` }}
          />
        </div>
      ))}
    </div>
  );
}
