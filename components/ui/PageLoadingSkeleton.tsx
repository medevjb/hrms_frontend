import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-[30%] rounded-md" />
      <Skeleton className="h-4 w-[50%] rounded-md" />
      <Skeleton className="mt-2 h-52 rounded-xl" />
    </div>
  );
}
