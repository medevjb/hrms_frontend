"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h2 className="font-heading text-xl font-semibold">Something went wrong</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or come back later if the problem
          continues.
        </p>
        <Button onClick={() => retry()} className="mt-1">
          Try again
        </Button>
      </div>
    </div>
  );
}
