import { expect, test } from "@playwright/test";
import { loginByApi } from "./helpers";

test("unauthenticated users are redirected to login for protected routes", async ({ page }) => {
  await page.goto("/stores");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("StoreHub")).toBeVisible();
});

test("owner can access restricted admin pages", async ({ page }) => {
  await loginByApi(page, "owner", "owner123");
  await expect(page).toHaveURL(/\/stores$/);
  await expect(page.locator("body")).not.toContainText("$2b$");

  await page.goto("/users");
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByText("Create co-owner and manager access with store-level permissions.")).toBeVisible();

  await page.goto("/payroll");
  await expect(page).toHaveURL(/\/payroll$/);
  await expect(page.getByText("Manage payroll and view employee compensation.")).toBeVisible();
});

test("manager is blocked from payroll and user management", async ({ page }) => {
  await loginByApi(page, "michael.c", "manager123");
  await expect(page).toHaveURL(/\/stores$/);

  await page.goto("/payroll");
  await expect(page).toHaveURL(/\/stores$/);

  await page.goto("/users");
  await expect(page).toHaveURL(/\/stores$/);
});

test("co-owner can sign in normally and manage password from settings instead of a forced reset", async ({ page }) => {
  await loginByApi(page, "coowner1", "temp123");
  await expect(page).toHaveURL(/\/stores$/);

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Change Password" })).toBeVisible();
});
