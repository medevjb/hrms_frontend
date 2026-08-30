"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Row selection state for a list table — per-row checkboxes plus a
 * select-all. Keyed by id so a selection survives a re-fetch that returns
 * the same rows in a different order.
 */
export function useRowSelection<T>(items: T[], getId: (item: T) => number) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const visibleIds = useMemo(() => items.map(getId), [items, getId]);

  const toggle = useCallback((id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((current) => {
      const allVisibleSelected = visibleIds.every((id) => current.has(id));
      if (allVisibleSelected) {
        const next = new Set(current);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...current, ...visibleIds]);
    });
  }, [visibleIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const selected = useMemo(
    () => items.filter((item) => selectedIds.has(getId(item))),
    [items, selectedIds, getId],
  );

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id)) && !allSelected;

  return {
    selectedIds,
    selected,
    isSelected: (id: number) => selectedIds.has(id),
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
    count: selected.length,
  };
}
