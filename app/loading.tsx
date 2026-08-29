import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";

export default function Loading() {
  return (
    <div className="w-full p-6">
      <PageLoadingSkeleton />
    </div>
  );
}
