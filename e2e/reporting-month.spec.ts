import { expect, test } from "@playwright/test";

// Full-stack: the backend (php artisan serve --port=8000) must be running
// alongside `npm run dev`.

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@admin.com");
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
});

test.afterEach(async ({ page }) => {
  // Leave the org back on calendar months for the next spec.
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Organization" }).click();
  await page.getByLabel("Reporting month cut-off day").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved")).toBeVisible();
});

test("a custom reporting cut-off shifts the attendance calendar and reports", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Organization" }).click();

  await page.getByLabel("Reporting month cut-off day").fill("25");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  // The live current-period line reflects the new boundaries.
  await expect(page.getByText(/Current reporting month:/)).toContainText("→");

  // The attendance calendar header shows the reporting month, and its
  // range spans two calendar months.
  await page.goto("/attendance");
  const heading = page.getByRole("heading", { level: 3 }).first();
  await expect(heading).toContainText(/\w+ \d{4}/);

  // Reports default their date range to the reporting month.
  await page.goto("/reports");
  await page.getByRole("combobox", { name: "Report Type" }).click();
  await page.getByRole("option", { name: "Attendance", exact: true }).click();
  await expect(page.getByText(/Defaults to \w+ \d{4}/)).toBeVisible();
});
