import { Skeleton } from "@/components/ui/skeleton";

export function ImageSkeletonGrid({ count = 18 }: { count?: number }) {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
      {Array.from({ length: count }).map((_, i) => {
        const heights = [160, 220, 180, 260, 200, 140, 240, 190, 170, 250];
        const h = heights[i % heights.length];
        return (
          <div key={i} className="break-inside-avoid mb-3">
            <Skeleton
              className="w-full rounded-lg"
              style={{ height: `${h}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function VideoSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border/30 bg-card">
          <Skeleton className="w-full aspect-video" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
