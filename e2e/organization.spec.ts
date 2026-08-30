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

test("creating a department, a team, and adding a member all work end to end", async ({ page }) => {
  const suffix = Date.now();
  const deptName = `E2E Dept ${suffix}`;
  const teamName = `E2E Team ${suffix}`;

  // Invite an employee first so there's someone to add to the team.
  await page.goto("/employees");
  await page.getByRole("button", { name: "Invite employee" }).click();
  await page.getByLabel("First name").fill("Org");
  await page.getByLabel("Last name").fill(`Member${suffix}`);
  await page.getByLabel("Work email").fill(`org-e2e-${suffix}@example.com`);
  await page.getByLabel("Designation").fill("Engineer");
  await page.getByLabel("Joining date").fill("September 1, 2026");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // Create a department.
  await page.goto("/departments");
  await page.getByRole("button", { name: "Add department" }).click();
  await page.getByLabel("Name").fill(deptName);
  await page.getByRole("button", { name: "Create department" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("link", { name: deptName })).toBeVisible();

  // Create a team inside it.
  await page.getByRole("link", { name: deptName }).click();
  await expect(page.getByRole("heading", { name: deptName })).toBeVisible();
  await page.getByRole("button", { name: "Add team" }).first().click();
  await page.getByLabel("Name").fill(teamName);
  await page.getByRole("button", { name: "Create team" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("link", { name: teamName })).toBeVisible();

  // Add the invited employee to the team.
  await page.getByRole("link", { name: teamName }).click();
  await expect(page.getByRole("heading", { name: teamName })).toBeVisible();
  await page.getByRole("combobox", { name: "Add a member" }).click();
  await page.getByRole("option", { name: `Org Member${suffix}` }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("cell", { name: `Org Member${suffix}` })).toBeVisible();
});
