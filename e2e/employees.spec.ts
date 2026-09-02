import { expect, test } from "@playwright/test";

// Full-stack: the backend (php artisan serve, or Herd) must be running
// alongside `npm run dev`.

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@admin.com");
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
});

test("inviting an employee shows them in the list with INVITED status", async ({ page }) => {
  // A unique surname per run so repeated runs don't pile up rows that
  // collide with the row assertion below.
  const surname = `Test${Date.now()}`;

  await page.getByRole("link", { name: "Employees" }).click();
  await expect(page).toHaveURL(/\/employees$/);

  await page.getByRole("button", { name: "Invite employee" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("First name").fill("Playwright");
  await dialog.getByLabel("Last name").fill(surname);
  await dialog.getByLabel("Work email").fill(`playwright-${Date.now()}@example.com`);
  await dialog.getByLabel("Designation").fill("QA Engineer");
  await dialog.getByLabel("Joining date").fill("September 1, 2026");
  await dialog.getByRole("button", { name: "Send invitation" }).click();

  // Dialog closes and the new hire lands in the list as INVITED.
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole("row", { name: new RegExp(`Playwright ${surname}`) });
  await expect(row).toBeVisible();
  await expect(row.getByText("INVITED")).toBeVisible();
});
