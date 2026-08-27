import { expect, test } from "@playwright/test";

// Full-stack: the backend (php artisan serve --port=8000) must be running
// alongside `npm run dev` for these to pass — playwright.config.ts only
// starts the frontend.

test("an unauthenticated visitor is redirected to the login page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a user can log in, see the shell, and log out", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@admin.com");
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("heading", { name: "Agency HRM" })).toBeVisible();
  await expect(page.locator(".mantine-AppShell-navbar")).toBeVisible();
  await expect(page.getByText("Admin", { exact: true })).toBeVisible();

  await page.getByText("Admin", { exact: true }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login$/);
});

test("a wrong password shows an error and stays on the login page", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@admin.com");
  await page.getByRole("textbox", { name: "Password" }).fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText(/failed|invalid|credentials/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
