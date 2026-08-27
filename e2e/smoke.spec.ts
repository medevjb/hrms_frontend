import { expect, test } from "@playwright/test";

// docs/PRD.md §101 Phase 0 exit condition: the app boots and its shell
// renders. There's no login page yet (that's Phase 1's auth module) — once
// it exists, this should navigate to it and assert on its form instead.
test("the app boots and renders the shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Agency HRM" })).toBeVisible();
  await expect(page.locator(".mantine-AppShell-navbar")).toBeVisible();
});
