import { expect, test } from "@playwright/test";

const ORIGIN = new URL(
  process.env.E2E_BASE_URL ?? "http://localhost:3000"
).origin;
const INK_RGB = "rgb(27, 27, 24)";

const USER = {
  id: "u_tape",
  name: "Tape",
  email: "tape@example.com",
  emailVerified: true,
  image: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const SESSION = {
  id: "s_tape",
  token: "tok_tape",
  userId: USER.id,
  expiresAt: "2027-08-01T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function mockSession(page: import("@playwright/test").Page, user: unknown) {
  return page.route("**/api/auth/get-session", (route) =>
    route.fulfill({
      json: user ? { session: SESSION, user } : { session: null, user: null },
    })
  );
}

test.describe("auth surfaces", () => {
  test("anonymous shorten prints a one-line sign-in nudge linking to /sign-in", async ({
    page,
  }) => {
    await mockSession(page, null);
    await page.goto("/");
    const nudge = page.getByText("// want to keep your receipts?");
    await expect(nudge).toHaveCount(0);
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/nudge");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    await expect(
      page.locator('section[aria-live="polite"]')
    ).toBeVisible();
    await expect(nudge).toBeVisible();
    await expect(nudge.getByRole("link", { name: "sign in →" })).toHaveAttribute(
      "href",
      "/sign-in"
    );
  });

  test("signed-in visitor sees the sign-out control and no nudge", async ({
    page,
  }) => {
    await mockSession(page, USER);
    await page.goto("/");
    const signOut = page.getByRole("button", { name: "SIGN OUT" });
    await expect(signOut).toBeVisible();
    await expect(page.getByText("signed in as")).toContainText(
      "tape@example.com"
    );
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/signed-in");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    await expect(
      page.locator('section[aria-live="polite"]')
    ).toBeVisible();
    await expect(page.getByText("// want to keep your receipts?")).toHaveCount(
      0
    );
  });

  test("SIGN OUT clears the signed-in state", async ({ page }) => {
    let signedIn = true;
    await page.route("**/api/auth/get-session", (route) =>
      route.fulfill({
        json: signedIn ? { session: SESSION, user: USER } : { session: null, user: null },
      })
    );
    await page.route("**/api/auth/sign-out", async (route) => {
      signedIn = false;
      await route.fulfill({ json: { success: true } });
    });
    await page.goto("/");
    const signOut = page.getByRole("button", { name: "SIGN OUT" });
    await expect(signOut).toBeVisible();
    await signOut.click();
    await expect(signOut).toHaveCount(0);
    await expect(page.getByText("signed in as")).toHaveCount(0);
  });

  test("sign-in page: email → code → signs in and lands home", async ({
    page,
  }) => {
    await mockSession(page, USER);
    await page.route("**/api/auth/email-otp/send-verification-otp", (route) =>
      route.fulfill({ json: { success: true } })
    );
    await page.route("**/api/auth/sign-in/email-otp", (route) =>
      route.fulfill({ json: { token: "tok_tape", user: USER } })
    );
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { level: 1, name: "SIGN IN" })
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Email" }).fill("tape@example.com");
    await page.getByRole("button", { name: "GET CODE" }).click();
    await expect(page.getByRole("textbox", { name: "Code" })).toBeVisible();
    await page.getByRole("textbox", { name: "Code" }).fill("123456");
    await page.getByRole("button", { name: "SIGN IN" }).click();
    await expect(page).toHaveURL(ORIGIN + "/");
    await expect(page.getByRole("button", { name: "SIGN OUT" })).toBeVisible();
  });

  test("sign-up page offers the same code flow", async ({ page }) => {
    await mockSession(page, USER);
    await page.route("**/api/auth/email-otp/send-verification-otp", (route) =>
      route.fulfill({ json: { success: true } })
    );
    await page.route("**/api/auth/sign-in/email-otp", (route) =>
      route.fulfill({ json: { token: "tok_tape", user: USER } })
    );
    await page.goto("/sign-up");
    await expect(
      page.getByRole("heading", { level: 1, name: "SIGN UP" })
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Email" }).fill("tape@example.com");
    await page.getByRole("button", { name: "GET CODE" }).click();
    await page.getByRole("textbox", { name: "Code" }).fill("123456");
    await page.getByRole("button", { name: "SIGN UP" }).click();
    await expect(page).toHaveURL(ORIGIN + "/");
  });

  test("invalid email is rejected before the network", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/sign-in");
    await page.getByRole("textbox", { name: "Email" }).fill("not-an-email");
    await page.getByRole("button", { name: "GET CODE" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "That doesn't look like an email address." })
    ).toBeVisible();
  });

  test("sign-in form wears the receipt theme", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/sign-in");
    const form = page.locator("form");
    await expect(form).toHaveCSS("border-top-color", INK_RGB);
    await expect(form).toHaveCSS("border-top-width", "2px");
    await expect(
      page.getByRole("link", { name: "← back to the printer" })
    ).toHaveAttribute("href", "/");
  });
});
