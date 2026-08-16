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

test.describe("voucher express pass OAuth integration", () => {
  for (const route of ["/sign-in", "/sign-up"] as const) {
    test(`renders [PASS A] EXPRESS header, provider buttons with SVG icons, and monospace guidance copy on ${route}`, async ({
      page,
    }) => {
      await mockSession(page);
      await page.goto(route);

      // Express pass header and badge
      await expect(page.getByText("[PASS A] EXPRESS")).toBeVisible();
      await expect(page.getByText("INSTANT", { exact: true })).toBeVisible();

      // Provider buttons with icons and labels
      const googleBtn = page.getByRole("button", { name: "sign in with google" });
      const githubBtn = page.getByRole("button", { name: "sign in with github" });
      await expect(googleBtn).toBeVisible();
      await expect(githubBtn).toBeVisible();
      await expect(googleBtn).toContainText("GOOGLE PASS");
      await expect(githubBtn).toContainText("GITHUB PASS");

      // Provider icons (svgs inside buttons)
      await expect(googleBtn.locator("svg")).toBeVisible();
      await expect(githubBtn.locator("svg")).toBeVisible();

      // Monospace guidance copy
      const guidance = page.getByText("⚡ No one-time code needed for express sign-in");
      await expect(guidance).toBeVisible();
      await expect(guidance).toHaveClass(/font-mono/);
    });
  }

  test("clicking provider button triggers visual loading state (STARTING…) and disables buttons", async ({
    page,
  }) => {
    await mockSession(page);
    let resolveSocial: () => void = () => {};
    await page.route("**/api/auth/sign-in/social**", async (route) => {
      await new Promise<void>((resolve) => {
        resolveSocial = resolve;
      });
      await route.fulfill({
        json: { url: `${ORIGIN}/mock-google-authorize`, redirect: true },
      });
    });

    await page.goto("/sign-in");
    const googleBtn = page.getByRole("button", { name: "sign in with google" });
    const githubBtn = page.getByRole("button", { name: "sign in with github" });

    await googleBtn.click();

    // Visual loading state
    await expect(googleBtn).toContainText("STARTING…");
    await expect(googleBtn).toBeDisabled();
    await expect(githubBtn).toBeDisabled();

    resolveSocial();
  });

  test("failed social sign-in displays error alert banner and restores button interactive state", async ({
    page,
  }) => {
    await mockSession(page);
    await page.route("**/api/auth/sign-in/social**", (route) =>
      route.fulfill({
        status: 500,
        json: { error: { message: "Provider communication failed" } },
      })
    );

    await page.goto("/sign-in");
    const googleBtn = page.getByRole("button", { name: "sign in with google" });
    await googleBtn.click();

    // Alert banner displayed
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Couldn't start sign-in — try again." });
    await expect(alert).toBeVisible();

    // Button restored to interactive state
    await expect(googleBtn).toBeEnabled();
    await expect(googleBtn).toContainText("GOOGLE PASS");
  });

  for (const route of ["/sign-in", "/sign-up"] as const) {
    for (const provider of ["google", "github"] as const) {
      test(`${provider} button on ${route} starts the provider flow`, async ({
        page,
      }) => {
        await mockSession(page);
        await mockProviderFlow(page, provider);
        await page.goto(route);
        await page
          .getByRole("button", { name: `sign in with ${provider}` })
          .click();
        await expect(
          page.getByRole("heading", { name: `${provider} authorize page` })
        ).toBeVisible();
      });
    }
  }
});