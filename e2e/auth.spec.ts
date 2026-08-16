import { expect, test } from "@playwright/test";

const ORIGIN = new URL(
  process.env.E2E_BASE_URL ?? "http://localhost:3000"
).origin;

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
    await expect(page.locator('section[aria-live="polite"]')).toBeVisible();
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
    await expect(page.locator('section[aria-live="polite"]')).toBeVisible();
    await expect(page.getByText("// want to keep your receipts?")).toHaveCount(0);
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

  test("sign-in page renders perforated voucher card with SESSION PASS and route metadata", async ({
    page,
  }) => {
    await mockSession(page, null);
    await page.goto("/sign-in");

    // Header stamp metadata
    await expect(page.getByText("VOUCHER #2026")).toBeVisible();
    await expect(page.getByText("SESSION PASS")).toBeVisible();
    await expect(page.getByText("GATE: AUTH-01")).toBeVisible();

    // Reciprocal and printer links
    await expect(
      page.getByRole("link", { name: "need an account? sign up →" })
    ).toHaveAttribute("href", "/sign-up");
    await expect(
      page.getByRole("link", { name: "← printer home" })
    ).toHaveAttribute("href", "/");

    // Two-part structure elements
    await expect(page.getByText("[PASS A] EXPRESS")).toBeVisible();
    await expect(page.getByText("[PASS B] EMAIL ONE-TIME CODE")).toBeVisible();
    await expect(page.getByText("STEP 01")).toBeVisible();
  });

  test("sign-up page renders perforated voucher card with IDENTITY PASS and reciprocal link to /sign-in", async ({
    page,
  }) => {
    await mockSession(page, null);
    await page.goto("/sign-up");

    // Header stamp metadata
    await expect(page.getByText("VOUCHER #2026")).toBeVisible();
    await expect(page.getByText("IDENTITY PASS")).toBeVisible();
    await expect(page.getByText("GATE: AUTH-01")).toBeVisible();

    // Reciprocal link
    await expect(
      page.getByRole("link", { name: "already registered? sign in →" })
    ).toHaveAttribute("href", "/sign-in");
  });

  test("invalid email is rejected before the network with high-contrast error banner", async ({
    page,
  }) => {
    await mockSession(page, null);
    let networkAttempted = false;
    await page.route("**/api/auth/email-otp/send-verification-otp", (route) => {
      networkAttempted = true;
      return route.fulfill({ json: { success: true } });
    });

    await page.goto("/sign-in");
    await page.getByLabel("Email Destination:").fill("invalid-email");
    await page.getByRole("button", { name: "REQUEST ONE-TIME CODE →" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "That doesn't look like an email address." })
    ).toBeVisible();
    expect(networkAttempted).toBe(false);
  });

  test("sign-in page: Step 01 email → Step 02 segmented OTP autofocus → auto-submits on 6th digit and lands home", async ({
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
    await page.getByLabel("Email Destination:").fill("tape@example.com");
    await page.getByRole("button", { name: "REQUEST ONE-TIME CODE →" }).click();

    // Step 02 view
    await expect(page.getByText("STEP 02")).toBeVisible();
    await expect(page.getByText("Code sent to:")).toBeVisible();
    await expect(page.getByText("tape@example.com")).toBeVisible();

    // Segmented OTP input
    const otpInput = page.locator("input[data-input-otp]");
    await expect(otpInput).toBeVisible();
    await expect(otpInput).toHaveAttribute("inputmode", "numeric");
    await expect(otpInput).toHaveAttribute("autocomplete", "one-time-code");
    await expect(otpInput).toBeFocused();

    // 6 distinct slots
    const slots = page.locator("[data-slot='input-otp-slot']");
    await expect(slots).toHaveCount(6);

    // Typing 6th digit auto-submits
    await otpInput.fill("123456");

    await expect(page).toHaveURL(ORIGIN + "/");
    await expect(page.getByRole("button", { name: "SIGN OUT" })).toBeVisible();
  });

  test("pasting 6-digit code distributes across all slots and auto-submits", async ({
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
    await page.getByLabel("Email Destination:").fill("paste@example.com");
    await page.getByRole("button", { name: "REQUEST ONE-TIME CODE →" }).click();

    await expect(page.getByText("STEP 02")).toBeVisible();
    const otpInput = page.locator("input[data-input-otp]");

    // Fill simulates paste / auto-fill distributing 6 digits and auto-submitting
    await otpInput.fill("987654");

    await expect(page).toHaveURL(ORIGIN + "/");
    await expect(page.getByRole("button", { name: "SIGN OUT" })).toBeVisible();
  });

  test("sign-up page offers the same segmented code flow with VALIDATE & SIGN UP button", async ({
    page,
  }) => {
    await mockSession(page, USER);
    await page.route("**/api/auth/email-otp/send-verification-otp", (route) =>
      route.fulfill({ json: { success: true } })
    );
    await page.route("**/api/auth/sign-in/email-otp", (route) =>
      route.fulfill({ json: { token: "tok_tape", user: USER } })
    );

    await page.goto("/sign-up");
    await page.getByLabel("Email Destination:").fill("tape@example.com");
    await page.getByRole("button", { name: "REQUEST ONE-TIME CODE →" }).click();

    await expect(page.getByText("STEP 02")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "VALIDATE & SIGN UP" })
    ).toBeVisible();

    const otpInput = page.locator("input[data-input-otp]");
    await otpInput.fill("654321");

    await expect(page).toHaveURL(ORIGIN + "/");
  });

  test("Step 02: change email returns to Step 01 with email retained in input", async ({
    page,
  }) => {
    await mockSession(page, null);
    await page.route("**/api/auth/email-otp/send-verification-otp", (route) =>
      route.fulfill({ json: { success: true } })
    );

    await page.goto("/sign-in");
    await page.getByLabel("Email Destination:").fill("change-me@example.com");
    await page.getByRole("button", { name: "REQUEST ONE-TIME CODE →" }).click();

    await expect(page.getByText("STEP 02")).toBeVisible();

    // Click change email
    await page.getByRole("button", { name: "← change email" }).click();

    // Back to Step 01 with email preserved
    await expect(page.getByText("STEP 01")).toBeVisible();
    await expect(page.getByLabel("Email Destination:")).toHaveValue("change-me@example.com");
  });

  test("Step 02: resend code triggers OTP dispatch and starts 30-second cooldown timer", async ({
    page,
  }) => {
    await mockSession(page, null);
    let sendCount = 0;
    await page.route("**/api/auth/email-otp/send-verification-otp", (route) => {
      sendCount++;
      return route.fulfill({ json: { success: true } });
    });

    await page.goto("/sign-in");
    await page.getByLabel("Email Destination:").fill("resend@example.com");
    await page.getByRole("button", { name: "REQUEST ONE-TIME CODE →" }).click();

    await expect(page.getByText("STEP 02")).toBeVisible();
    expect(sendCount).toBe(1);

    const resendBtn = page.getByRole("button", { name: "resend code" });
    await expect(resendBtn).toBeVisible();
    await expect(resendBtn).toBeEnabled();
    await resendBtn.click();

    expect(sendCount).toBe(2);

    // Cooldown state active
    const cooldownBtn = page.getByRole("button", { name: /resend in 30s|resend in 29s/ });
    await expect(cooldownBtn).toBeVisible();
    await expect(cooldownBtn).toBeDisabled();
  });

  test("Step 02: invalid or expired code displays high-contrast error banner while keeping input interactive", async ({
    page,
  }) => {
    await mockSession(page, null);
    await page.route("**/api/auth/email-otp/send-verification-otp", (route) =>
      route.fulfill({ json: { success: true } })
    );
    await page.route("**/api/auth/sign-in/email-otp", (route) =>
      route.fulfill({
        status: 400,
        json: { error: { message: "That code didn't work — check it and try again." } },
      })
    );

    await page.goto("/sign-in");
    await page.getByLabel("Email Destination:").fill("error@example.com");
    await page.getByRole("button", { name: "REQUEST ONE-TIME CODE →" }).click();

    await expect(page.getByText("STEP 02")).toBeVisible();
    const otpInput = page.locator("input[data-input-otp]");
    await otpInput.fill("000000");

    // Error banner displayed
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "That code didn't work — check it and try again." });
    await expect(alert).toBeVisible();

    // Input remains interactive
    await expect(otpInput).toBeEnabled();
    await otpInput.clear();
    await otpInput.fill("111111");
    await expect(otpInput).toHaveValue("111111");
  });
});
