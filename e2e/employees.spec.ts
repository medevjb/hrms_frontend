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

test("inviting an employee shows them in the list with INVITED status", async ({ page }) => {
  await page.getByRole("link", { name: "Employees" }).click();
  await expect(page).toHaveURL(/\/employees$/);

  await page.getByRole("link", { name: "Invite employee" }).click();
  await expect(page).toHaveURL(/\/employees\/new$/);

  await page.getByLabel("First name").fill("Playwright");
  await page.getByLabel("Last name").fill("Testuser");
  await page.getByLabel("Email").fill(`playwright-${Date.now()}@example.com`);
  await page.getByLabel("Designation").fill("QA Engineer");
  await page.getByLabel("Joining date").fill("September 1, 2026");
  await page.getByRole("button", { name: "Send invitation" }).click();

  // Redirects to the detail page on success.
  await expect(page).toHaveURL(/\/employees\/\d+$/);
  await expect(page.getByRole("heading", { name: "Playwright Testuser" })).toBeVisible();
  await expect(page.getByText("INVITED")).toBeVisible();

  await page.getByRole("link", { name: "Employees" }).click();
  await expect(page.getByText("Playwright Testuser").first()).toBeVisible();
});
