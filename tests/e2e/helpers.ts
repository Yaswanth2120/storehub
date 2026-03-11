import { expect, Page } from "@playwright/test";

export async function loginByApi(page: Page, username: string, password: string) {
  const csrfResponse = await page.request.get("/api/auth/csrf");
  expect(csrfResponse.ok()).toBeTruthy();

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  const response = await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      username,
      password,
      callbackUrl: "http://localhost:3100/stores",
      json: "true",
    },
  });

  expect(response.ok()).toBeTruthy();
  await page.goto("/stores");
}
