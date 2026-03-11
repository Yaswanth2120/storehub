import { expect, Page, test } from "@playwright/test";
import { loginByApi } from "./helpers";

async function loginAsOwner(page: Page) {
  await loginByApi(page, "owner", "owner123");
  await expect(page).toHaveURL(/\/stores$/);
}

test("payroll date filters preserve the selected range", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/payroll");

  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill("2026-03-05");
  await dateInputs.nth(1).fill("2026-03-11");

  await expect(page.getByText("Pay period: Mar 5, 2026 - Mar 11, 2026")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Emma Reed" })).toBeVisible();
});

test("payroll shows varying pay rates when a worker changed pay inside the range", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/payroll");

  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill("2026-03-05");
  await dateInputs.nth(1).fill("2026-03-11");

  await expect(page.getByRole("cell", { name: "Varies" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "$988.00" })).toBeVisible();
});

test("change pay modal shows latest pay history for employees", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/employees");

  const emmaRow = page.getByRole("row", { name: /Emma Reed/i });
  await emmaRow.getByRole("button", { name: "Change Pay Rate" }).click();

  await expect(page.getByText("Pay changed from $17.00 to $18.50 effective Mar 9, 2026.")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
});
