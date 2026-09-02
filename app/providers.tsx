"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { toast, Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { apiErrorMessage } from "@/lib/api-error";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created once per browser session (useState lazy init), not once per module,
  // so server-rendered requests never share a QueryClient across users.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Every failed mutation and every failed query surfaces an error
        // toast automatically — one consistent channel for feedback across
        // the whole app. A call site that renders its own failure UI opts
        // out with `meta: { skipErrorToast: true }`; `meta.errorToast`
        // overrides the generic fallback when the server sends no message.
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            if (mutation.meta?.skipErrorToast) return;
            toast.error(apiErrorMessage(error, mutation.meta?.errorToast ?? GENERIC_ERROR));
          },
          onSuccess: (_data, _vars, _ctx, mutation) => {
            if (mutation.meta?.successToast) toast.success(mutation.meta.successToast);
          },
        }),
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.skipErrorToast) return;
            toast.error(apiErrorMessage(error, query.meta?.errorToast ?? GENERIC_ERROR));
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
