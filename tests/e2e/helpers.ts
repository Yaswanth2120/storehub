import { expect, Page } from "@playwright/test";

const demoCredentials = new Map(
  (process.env.STAGING_DEMO_CREDENTIALS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      return [
        entry.slice(0, separatorIndex).trim(),
        entry.slice(separatorIndex + 1).trim(),
      ] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry?.[0] && entry?.[1])),
);

export function getPasswordForUser(username: string, fallbackPassword: string) {
  return demoCredentials.get(username) ?? fallbackPassword;
}

export async function loginByApi(page: Page, username: string, password?: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Enter username").fill(username);
  await page.getByPlaceholder("Enter password").fill(getPasswordForUser(username, password ?? ""));
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/stores$/);
}
