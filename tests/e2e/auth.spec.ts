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
  await expect(page.getByText("Control co-owner and manager accounts")).toBeVisible();

  await page.goto("/payroll");
  await expect(page).toHaveURL(/\/payroll$/);
  await expect(page.getByText("Review payroll by Apple-style weekly periods.")).toBeVisible();
});

test("manager is blocked from payroll and user management", async ({ page }) => {
  await loginByApi(page, "michael.c", "manager123");
  await expect(page).toHaveURL(/\/stores$/);

  await page.goto("/employees");
  await expect(page).toHaveURL(/\/employees$/);
  await expect(page.getByRole("columnheader", { name: "Pay Rate" })).toHaveCount(0);

  await page.goto("/payroll");
  await expect(page).toHaveURL(/\/stores$/);

  await page.goto("/users");
  await expect(page).toHaveURL(/\/stores$/);
});

test("co-owner can sign in normally and manage password from settings instead of a forced reset", async ({ page }) => {
  await loginByApi(page, "coowner1", "coowner123");
  await expect(page).toHaveURL(/\/stores$/);

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Change Password" })).toBeVisible();
  await expect(page.getByText("Recovery Email")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("owner@storehub.dev");
});

test("co-owner can assign stores to managers and generate a reset password", async ({ page }) => {
  await loginByApi(page, "coowner1", "coowner123");
  await page.goto("/users");
  await expect(page).toHaveURL(/\/users$/);

  const sarahRow = page.getByRole("row", { name: /sarah\.j/i });
  await expect(sarahRow).toBeVisible();

  if ((await sarahRow.getByText("Westside Location").count()) === 0) {
    await sarahRow.getByRole("button", { name: "Edit" }).click();
    const editDialog = page.getByRole("dialog", { name: "Edit user" });
    await editDialog.getByText("Westside Location").click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("User updated")).toBeVisible();
    await expect(sarahRow.getByText("Westside Location")).toBeVisible();
  }

  await sarahRow.getByRole("button", { name: "Reset Password" }).click();
  await page.getByRole("button", { name: "Generate password" }).click();
  await expect(page.locator('input[readonly][value]:not([value=""])').last()).toBeVisible();
});

test("logout returns to the current origin login page", async ({ page }) => {
  await loginByApi(page, "owner", "owner123");
  await expect(page).toHaveURL(/\/stores$/);

  await page.getByRole("button", { name: "OW" }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.url()).toContain("http://localhost:3100/login");
});
