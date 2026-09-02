"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CircleCheckIcon, InfoIcon, OctagonAlertIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small self-contained toast system — no dependency, one look. `toast`
 * is a module singleton anything can call; `<Toaster />` (mounted once in
 * providers) renders the stack. Each toast is a clean card with a tinted
 * status chip and a progress bar that drains toward auto-dismiss and
 * pauses while the pointer is over the stack.
 */

type ToastType = "success" | "error" | "info";

type ToastRecord = {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration: number;
};

const MAX_VISIBLE = 4;

let items: ToastRecord[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function push(type: ToastType, message: string, description?: string): string {
  const id = Math.random().toString(36).slice(2);
  const duration = type === "error" ? 6000 : 4000;
  // Collapse duplicates: when the same message is already on screen (a
  // component handler and the global mutation/query handler both firing,
  // or a refetch loop), drop the old card and re-add with a fresh id so
  // the timer restarts instead of stacking a second identical copy.
  const deduped = items.filter(
    (item) => !(item.type === type && item.message === message && item.description === description),
  );
  items = [{ id, type, message, description, duration }, ...deduped].slice(0, MAX_VISIBLE);
  emit();
  return id;
}

function remove(id?: string) {
  items = id ? items.filter((item) => item.id !== id) : [];
  emit();
}

export const toast = {
  success: (message: string, description?: string) => push("success", message, description),
  error: (message: string, description?: string) => push("error", message, description),
  info: (message: string, description?: string) => push("info", message, description),
  dismiss: (id?: string) => remove(id),
};

const EMPTY: ToastRecord[] = [];

function useToasts(): ToastRecord[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => items,
    () => EMPTY,
  );
}

const META: Record<ToastType, { Icon: typeof InfoIcon; chip: string; bar: string; role: "status" | "alert" }> = {
  success: {
    Icon: CircleCheckIcon,
    chip: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    role: "status",
  },
  error: {
    Icon: OctagonAlertIcon,
    chip: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    role: "alert",
  },
  info: {
    Icon: InfoIcon,
    chip: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    bar: "bg-sky-500",
    role: "status",
  },
};

function ToastCard({ record }: { record: ToastRecord }) {
  const [state, setState] = useState<"enter" | "open" | "leave">("enter");
  const [paused, setPaused] = useState(false);
  const remaining = useRef(record.duration);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const close = useCallback(() => {
    setState("leave");
    window.setTimeout(() => remove(record.id), 200);
  }, [record.id]);

  const resume = useCallback(() => {
    setPaused(false);
    startedAt.current = Date.now();
    clearTimeout(timer.current);
    timer.current = setTimeout(close, Math.max(0, remaining.current));
  }, [close]);

  const pause = useCallback(() => {
    setPaused(true);
    clearTimeout(timer.current);
    remaining.current -= Date.now() - startedAt.current;
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setState("open"));
    startedAt.current = Date.now();
    timer.current = setTimeout(close, remaining.current);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer.current);
    };
  }, [close]);

  const meta = META[record.type];

  return (
    <li
      data-state={state}
      className="overflow-hidden transition-all duration-200 ease-out data-[state=leave]:max-h-0 data-[state=leave]:opacity-0"
    >
      <div
        role={meta.role}
        onMouseEnter={pause}
        onMouseLeave={resume}
        data-state={state}
        className={cn(
          "group pointer-events-auto relative mb-2 flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-popover p-3 pr-9 text-popover-foreground shadow-lg shadow-black/5 ring-1 ring-black/[0.02]",
          "transition-all duration-200 ease-out motion-reduce:transition-none",
          "data-[state=enter]:translate-x-3 data-[state=enter]:opacity-0",
          "data-[state=leave]:translate-x-3 data-[state=leave]:opacity-0",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
            meta.chip,
          )}
        >
          <meta.Icon className="size-3.5" />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm leading-snug font-medium text-foreground">{record.message}</p>
          {record.description && (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{record.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 rounded-md p-0.5 text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <XIcon className="size-3.5" />
        </button>

        <span
          aria-hidden
          className={cn(
            "absolute bottom-0 left-0 h-0.5 w-full origin-left motion-reduce:hidden",
            meta.bar,
          )}
          style={{
            animation: `toast-progress ${record.duration}ms linear forwards`,
            animationPlayState: state === "open" && !paused ? "running" : "paused",
          }}
        />
      </div>
    </li>
  );
}

export function Toaster() {
  const records = useToasts();

  // The stack lives in a portal on document.body; there is nothing to
  // render on the server or before the DOM exists.
  if (typeof document === "undefined") return null;

  return createPortal(
    <ul
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[100] m-0 flex w-[calc(100vw-2rem)] max-w-sm list-none flex-col p-0 sm:right-5 sm:bottom-5"
    >
      {records.map((record) => (
        <ToastCard key={record.id} record={record} />
      ))}
    </ul>,
    document.body,
  );
}
