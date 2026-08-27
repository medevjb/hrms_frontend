import { createTheme } from "@mantine/core";

// Palette, spacing, and typography choices belong here once the HR feature
// modules start needing them (docs/PRD.md §7, §6.2) — Mantine defaults for now.
export const theme = createTheme({
  primaryColor: "blue",
  fontFamily: "var(--font-geist-sans), sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  defaultRadius: "md",
});
