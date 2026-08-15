import { expect, test } from "@playwright/test";

const ORIGIN = new URL(
  process.env.E2E_BASE_URL ?? "http://localhost:3000"
).origin;

function mockSession(page: import("@playwright/test").Page) {
  return page.route("**/api/auth/get-session", (route) =>
    route.fulfill({ json: { session: null, user: null } })
  );
}

function mockProviderFlow(
  page: import("@playwright/test").Page,
  provider: string
) {
  const authorizeUrl = `${ORIGIN}/mock-${provider}-authorize`;
  return Promise.all([
    page.route(`**/api/auth/sign-in/social**`, async (route) => {
      expect(route.request().postDataJSON()).toMatchObject({
        provider,
        callbackURL: "/",
      });
      await route.fulfill({
        json: { url: authorizeUrl, redirect: true },
      });
    }),
    page.route(`**/mock-${provider}-authorize`, (route) =>
      route.fulfill({
        headers: { "content-type": "text/html" },
        body: `<h1>${provider} authorize page</h1>`,
      })
    ),
  ]);
}

for (const provider of ["google", "github"] as const) {
  test(`${provider} button on /sign-in starts the provider flow`, async ({
    page,
  }) => {
    await mockSession(page);
    await mockProviderFlow(page, provider);
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: `sign in with ${provider}` })
      .click();
    await expect(
      page.getByRole("heading", { name: `${provider} authorize page` })
    ).toBeVisible();
  });

  test(`${provider} button on /sign-up starts the provider flow`, async ({
    page,
  }) => {
    await mockSession(page);
    await mockProviderFlow(page, provider);
    await page.goto("/sign-up");
    await page
      .getByRole("button", { name: `sign in with ${provider}` })
      .click();
    await expect(
      page.getByRole("heading", { name: `${provider} authorize page` })
    ).toBeVisible();
  });
}