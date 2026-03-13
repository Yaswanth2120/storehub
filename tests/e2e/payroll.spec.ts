import { expect, Page, test } from "@playwright/test";
import { loginByApi } from "./helpers";

async function loginAsOwner(page: Page) {
  await loginByApi(page, "owner", "owner123");
  await expect(page).toHaveURL(/\/stores$/);
}

test("payroll defaults to bi-weekly and preserves the selected Saturday-based period", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/payroll");

  await expect(page.getByRole("button", { name: /Mar 7, 2026 - Mar 20, 2026/i }).first()).toBeVisible();
  await expect(page.getByRole("paragraph").filter({ hasText: "Mar 7, 2026 - Mar 20, 2026" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Emma Reed" })).toBeVisible();
});

test("payroll shows varying pay rates when a worker changed pay inside the range", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/payroll");

  await page.getByRole("button", { name: /Mar 7, 2026 - Mar 20, 2026/i }).click();
  await page.getByRole("button", { name: "Feb 28, 2026 - Mar 13, 2026" }).click();

  await expect(page.getByRole("cell", { name: "Varies" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: /\$\d+\.\d{2}/ }).last()).toBeVisible();
});

test("change pay modal shows latest pay history for employees", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/employees");

  const emmaRow = page.getByRole("row", { name: /Emma Reed/i });
  await emmaRow.getByRole("button", { name: "Change Pay Rate" }).click();

  await expect(page.getByText(/Pay changed from \$17\.00 to \$18\.50 effective/i)).toBeVisible();
  await page.getByRole("combobox").filter({ hasText: /Future weeks only/i }).click();
  await page.getByRole("option", { name: "Selected weekly range" }).click();
  await expect(page.locator('input[type="date"]')).toHaveCount(0);
  await expect(page.getByText("Start Week")).toBeVisible();
  await expect(page.getByText("End Week")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
});
