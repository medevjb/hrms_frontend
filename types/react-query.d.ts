import "@tanstack/react-query";

/**
 * Typed `meta` for queries and mutations. The global toast handlers in
 * `app/providers.tsx` read these:
 *
 * - `skipErrorToast` — this query/mutation surfaces its own failure UI;
 *   don't fire the automatic error toast.
 * - `errorToast` — fallback message for the automatic error toast when the
 *   server response carries no human-readable message.
 * - `successToast` — message the global handler shows on a successful
 *   mutation (opt-in; most call sites toast success themselves).
 */
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      skipErrorToast?: boolean;
      errorToast?: string;
    };
    mutationMeta: {
      skipErrorToast?: boolean;
      errorToast?: string;
      successToast?: string;
    };
  }
}
