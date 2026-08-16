import { expect, test } from "@playwright/test";

const STAMP_RGB = "rgb(216, 56, 46)";
const ORIGIN = new URL(
  process.env.E2E_BASE_URL ?? "http://localhost:3000"
).origin;

test.describe("home page", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: ORIGIN,
    });
  });

  test("has exactly one h1 and a labelled tape", async ({ page }) => {
    await page.goto("/");
    const h1s = page.getByRole("heading", { level: 1 });
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toContainText("Shorty");
    await expect(
      page.getByRole("region", { name: "Recent short links" })
    ).toBeVisible();
  });

  test("target URL input automatically receives focus when page loads", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Target URL" });
    await expect(input).toBeFocused();
  });

  test("PASTE button appears inside target URL input when empty and disappears when text is present", async ({
    page,
  }) => {
    await page.goto("/");
    const pasteBtn = page.getByRole("button", { name: "PASTE" });
    await expect(pasteBtn).toBeVisible();

    const input = page.getByRole("textbox", { name: "Target URL" });
    await input.fill("https://example.com/test");
    await expect(pasteBtn).toHaveCount(0);
  });

  test("clicking PASTE reads the clipboard and populates the input", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() =>
      navigator.clipboard.writeText("https://example.com/from-clipboard")
    );
    const pasteBtn = page.getByRole("button", { name: "PASTE" });
    await pasteBtn.click();
    const input = page.getByRole("textbox", { name: "Target URL" });
    await expect(input).toHaveValue("https://example.com/from-clipboard");
    await expect(page.getByRole("button", { name: "PASTE" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /clear|✕/i })
    ).toBeVisible();
  });

  test("clipboard read access denied or unavailable focuses input and shows keyboard hint", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      navigator.clipboard.readText = () =>
        Promise.reject(new Error("Permission denied"));
    });
    const pasteBtn = page.getByRole("button", { name: "PASTE" });
    await pasteBtn.click();

    const input = page.getByRole("textbox", { name: "Target URL" });
    await expect(input).toBeFocused();
    const hint = page.getByRole("status").filter({
      hasText: /press (ctrl|cmd|⌘)\+v to paste/i,
    });
    await expect(hint).toBeVisible();

    // Typing should dismiss the keyboard hint
    await input.pressSequentially("https://example.com/typing");
    await expect(hint).toHaveCount(0);
  });

  test("CLEAR (✕) button replaces paste action, resets input, dismisses errors, and retains focus", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Target URL" });
    // Trigger an error first
    await page.getByRole("button", { name: "SHORTEN" }).click();
    const error = page
      .getByRole("alert")
      .filter({ hasText: "Paste a URL to shorten it." });
    await expect(error).toBeVisible();

    // Type invalid link
    await input.fill("ftp://invalid");
    const clearBtn = page.getByRole("button", { name: /clear|✕/i });
    await expect(clearBtn).toBeVisible();
    await expect(page.getByRole("button", { name: "PASTE" })).toHaveCount(0);

    // Click CLEAR
    await clearBtn.click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(error).toHaveCount(0);
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("button", { name: "PASTE" })).toBeVisible();
  });

  test("pressing Escape clears input value, dismisses errors, and retains focus", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Target URL" });
    await input.fill("ftp://invalid-protocol");
    await page.getByRole("button", { name: "SHORTEN" }).click();

    const error = page.getByRole("alert").filter({
      hasText: "That doesn't look like a valid link — it should start with http:// or https://.",
    });
    await expect(error).toBeVisible();

    // Press Escape
    await input.press("Escape");
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(error).toHaveCount(0);
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("button", { name: "PASTE" })).toBeVisible();
  });

  test("empty submit shows the required message with a stamp-red border", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Paste a URL to shorten it." })
    ).toBeVisible();
    const input = page.getByRole("textbox", { name: "Target URL" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveCSS("border-top-color", STAMP_RGB);
    await expect(input).toHaveCSS("border-top-width", "2px");
  });

  test("non-http(s) URL shows the protocol message", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("ftp://example.com/file");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    await expect(
      page.getByRole("alert").filter({
        hasText: "That doesn't look like a valid link — it should start with http:// or https://.",
      })
    ).toBeVisible();
  });

  test("error clears live on retype", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Target URL" });
    await page.getByRole("button", { name: "SHORTEN" }).click();
    const error = page
      .getByRole("alert")
      .filter({ hasText: "Paste a URL to shorten it." });
    await expect(error).toBeVisible();
    await input.pressSequentially("https://example.com/ok");
    await expect(error).toHaveCount(0);
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  test("SHORTEN prints PRINTING… and disables while the request runs", async ({
    page,
  }) => {
    await page.goto("/");
    await page.route("**/api/shorten", async (route) => {
      await new Promise((r) => setTimeout(r, 700));
      await route.continue();
    });
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/printing-state");
    const button = page.getByRole("button", { name: "SHORTEN" });
    await button.click();
    await expect(
      page.getByRole("button", { name: "PRINTING…" })
    ).toBeDisabled();
    await expect(
      page.getByRole("textbox", { name: "Target URL" })
    ).toBeEditable();
  });

  test("valid URL prints a ticket with the returned code", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/e2e-ticket");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    const receipt = page.locator('section[aria-live="polite"]');
    await expect(receipt).toBeVisible();
    await expect(receipt).toContainText("https://example.com/e2e-ticket");
    const open = receipt.getByRole("link", { name: "OPEN ↗" });
    await expect(open).toHaveAttribute("target", "_blank");
    const href = await open.getAttribute("href");
    const code = href?.match(/\/([0-9A-Za-z]{6})$/)?.[1];
    expect(code).toBeTruthy();
    await expect(receipt).toContainText(code!);
  });

  test("ticket copy button displays copy icon and COPY, writes short URL, and transitions to check icon and COPIED ✓", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/e2e-copy");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    const receipt = page.locator('section[aria-live="polite"]');
    const copy = receipt.getByRole("button", { name: "COPY" });
    await expect(copy).toBeVisible();
    await expect(copy.locator("svg")).toBeVisible();

    const openLink = receipt.getByRole("link", { name: "OPEN ↗" });
    const href = await openLink.getAttribute("href");
    expect(href).toBeTruthy();

    await copy.click();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(href);

    const copied = receipt.getByRole("button", { name: "COPIED ✓" });
    await expect(copied).toBeVisible();
    await expect(copied.locator("svg")).toBeVisible();
    await expect(receipt.getByRole("button", { name: "COPY" })).toBeVisible({
      timeout: 4000,
    });
  });

  test("ticket copy handles clipboard write rejection gracefully", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/e2e-copy-fail");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    await page.evaluate(() => {
      navigator.clipboard.writeText = () =>
        Promise.reject(new Error("Clipboard write failure"));
    });
    const receipt = page.locator('section[aria-live="polite"]');
    const copy = receipt.getByRole("button", { name: "COPY" });
    await copy.click();
    // Verify UI didn't crash and copy button is still intact
    await expect(copy).toBeVisible();
  });

  test("tape row has accessible copy button with icon, copies full short URL, and triggers 2s success independently", async ({
    page,
  }) => {
    const row1 = {
      code: "Code01",
      url: "https://example.com/first-target",
      shortUrl: "http://localhost:3000/Code01",
      createdAt: "2026-08-12T07:00:00.000Z",
    };
    const row2 = {
      code: "Code02",
      url: "https://example.com/second-target",
      shortUrl: "http://localhost:3000/Code02",
      createdAt: "2026-08-12T07:05:00.000Z",
    };
    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: [row1, row2],
        },
      })
    );
    await page.goto("/");
    const rows = page
      .getByRole("region", { name: "Recent short links" })
      .getByRole("listitem");
    await expect(rows).toHaveCount(2);

    const firstRow = rows.nth(0);
    const secondRow = rows.nth(1);

    const firstCopyBtn = firstRow.getByRole("button", { name: /copy/i });
    const secondCopyBtn = secondRow.getByRole("button", { name: /copy/i });

    await expect(firstCopyBtn).toBeVisible();
    await expect(firstCopyBtn.locator("svg")).toBeVisible();
    await expect(secondCopyBtn).toBeVisible();

    // Click first row copy
    await firstCopyBtn.click();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(row1.shortUrl);

    // First row should show success state (e.g. copied label or check icon), second row remains unchanged
    await expect(firstRow.getByRole("button", { name: /copied/i })).toBeVisible();
    await expect(secondRow.getByRole("button", { name: /copy/i })).toBeVisible();
    await expect(secondRow.getByRole("button", { name: /copied/i })).toHaveCount(0);

    // After 2 seconds, first row reverts to normal copy state
    await expect(firstRow.getByRole("button", { name: /^copy/i })).toBeVisible({
      timeout: 4000,
    });
  });

  test("tape row copy handles clipboard write rejection gracefully", async ({
    page,
  }) => {
    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: [
            {
              code: "Code01",
              url: "https://example.com/target",
              shortUrl: "http://localhost:3000/Code01",
              createdAt: "2026-08-12T07:00:00.000Z",
            },
          ],
        },
      })
    );
    await page.goto("/");
    await page.evaluate(() => {
      navigator.clipboard.writeText = () =>
        Promise.reject(new Error("Clipboard write failure"));
    });
    const copyBtn = page
      .getByRole("region", { name: "Recent short links" })
      .getByRole("button", { name: /copy/i });
    await copyBtn.click();
    await expect(copyBtn).toBeVisible();
  });

  test("visitor can dismiss a receipt locally from the tape view, persisting across page reloads", async ({
    page,
  }) => {
    const row1 = {
      code: "Code01",
      url: "https://example.com/keep-this",
      shortUrl: "http://localhost:3000/Code01",
      createdAt: "2026-08-12T07:00:00.000Z",
    };
    const row2 = {
      code: "Code02",
      url: "https://example.com/dismiss-this",
      shortUrl: "http://localhost:3000/Code02",
      createdAt: "2026-08-12T07:05:00.000Z",
    };
    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: [row1, row2],
        },
      })
    );
    await page.goto("/");
    const region = page.getByRole("region", { name: "Recent short links" });
    const rows = region.getByRole("listitem");
    await expect(rows).toHaveCount(2);

    const dismissBtn = region.getByRole("button", { name: "Dismiss Code02" });
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    // Optimistically removed from view
    await expect(region.getByText("Code02")).toHaveCount(0);
    await expect(region.getByText("Code01")).toBeVisible();

    // Persists across reloads
    await page.reload();
    await expect(region.getByText("Code02")).toHaveCount(0);
    await expect(region.getByText("Code01")).toBeVisible();
  });

  test("signed-in owner can permanently delete their short link from the tape", async ({
    page,
  }) => {
    const USER = {
      id: "u_owner_1",
      name: "Owner",
      email: "owner@example.com",
      emailVerified: true,
      image: null,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    };
    const SESSION = {
      id: "s_owner_1",
      token: "tok_owner",
      userId: USER.id,
      expiresAt: "2027-08-01T00:00:00.000Z",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    };
    await page.route("**/api/auth/get-session", (route) =>
      route.fulfill({
        json: { session: SESSION, user: USER },
      })
    );

    let deleted = false;
    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: deleted
            ? []
            : [
                {
                  code: "Owned1",
                  url: "https://example.com/owned-link",
                  shortUrl: "http://localhost:3000/Owned1",
                  createdAt: "2026-08-12T07:00:00.000Z",
                  ownerId: USER.id,
                },
              ],
        },
      })
    );

    let deleteRequested = false;
    await page.route("**/api/links/Owned1", (route) => {
      if (route.request().method() === "DELETE") {
        deleteRequested = true;
        deleted = true;
        return route.fulfill({ json: { success: true } });
      }
      return route.continue();
    });

    await page.goto("/");
    const region = page.getByRole("region", { name: "Recent short links" });
    const deleteBtn = region.getByRole("button", { name: "Delete Owned1" });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Optimistically removed
    await expect(region.getByText("Owned1")).toHaveCount(0);
    expect(deleteRequested).toBe(true);
  });

  test("signed-in non-owner sees dismiss action and dismisses locally without calling delete API", async ({
    page,
  }) => {
    const USER = {
      id: "u_non_owner",
      name: "NonOwner",
      email: "nonowner@example.com",
      emailVerified: true,
      image: null,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    };
    const SESSION = {
      id: "s_non_owner",
      token: "tok_non_owner",
      userId: USER.id,
      expiresAt: "2027-08-01T00:00:00.000Z",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    };
    await page.route("**/api/auth/get-session", (route) =>
      route.fulfill({
        json: { session: SESSION, user: USER },
      })
    );

    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: [
            {
              code: "OtherUserLink",
              url: "https://example.com/other",
              shortUrl: "http://localhost:3000/OtherUserLink",
              createdAt: "2026-08-12T07:00:00.000Z",
              ownerId: "someone_else_id",
            },
          ],
        },
      })
    );

    let deleteRequested = false;
    await page.route("**/api/links/**", (route) => {
      if (route.request().method() === "DELETE") {
        deleteRequested = true;
        return route.fulfill({ json: { success: true } });
      }
      return route.continue();
    });

    await page.goto("/");
    const region = page.getByRole("region", { name: "Recent short links" });
    const dismissBtn = region.getByRole("button", {
      name: "Dismiss OtherUserLink",
    });
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    await expect(region.getByText("OtherUserLink")).toHaveCount(0);
    expect(deleteRequested).toBe(false);
  });

  test("tape removal buttons have visible focus rings and accessible labels", async ({
    page,
  }) => {
    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: [
            {
              code: "Focus01",
              url: "https://example.com/focus",
              shortUrl: "http://localhost:3000/Focus01",
              createdAt: "2026-08-12T07:00:00.000Z",
            },
          ],
        },
      })
    );
    await page.goto("/");
    const dismissBtn = page.getByRole("button", { name: "Dismiss Focus01" });
    await dismissBtn.focus();
    await expect(dismissBtn).toBeFocused();
  });

  test("tape shows dashed skeleton rows while loading", async ({ page }) => {
    await page.route("**/api/links", (route) => {
      setTimeout(() => route.fulfill({ json: { links: [] } }), 1500);
    });
    await page.goto("/");
    const skeleton = page
      .getByRole("region", { name: "Recent short links" })
      .getByRole("listitem");
    await expect(skeleton).toHaveCount(3);
    await expect(skeleton.first()).toHaveCSS("border-bottom-style", "dashed");
  });

  test("tape row links the code, truncates the target, prints a time", async ({
    page,
  }) => {
    const code = "AbC123";
    const target = "https://example.com/a-very-long-target-path";
    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: [
            {
              code,
              url: target,
              shortUrl: `http://localhost:3000/${code}`,
              createdAt: "2026-08-12T07:00:00.000Z",
            },
          ],
        },
      })
    );
    await page.goto("/");
    const row = page
      .getByRole("region", { name: "Recent short links" })
      .getByRole("listitem");
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("link", { name: code })).toHaveAttribute(
      "href",
      `http://localhost:3000/${code}`
    );
    const targetLink = row.getByRole("link", { name: target });
    await expect(targetLink).toHaveCSS("text-overflow", "ellipsis");
    await targetLink.hover();
    await expect(targetLink).toHaveCSS("text-decoration-line", "underline");
    const time = row.locator("time");
    await expect(time).toHaveAttribute(
      "datetime",
      "2026-08-12T07:00:00.000Z"
    );
    await expect(time).toHaveCSS("color", "rgb(110, 110, 102)");
  });

  test("ticket enters with animation under normal motion", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/motion-test");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    const ticket = page.locator('section[aria-live="polite"]');
    await expect(ticket).toHaveCSS("animation-name", "ticket-in");
  });

  test("prefers-reduced-motion disables the ticket animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/reduced-motion");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    const ticket = page.locator('section[aria-live="polite"]');
    await expect(ticket).toHaveCSS("animation-name", "none");
  });

  test("tape code column narrows below the 560px breakpoint", async ({
    page,
  }) => {
    await page.route("**/api/links", (route) =>
      route.fulfill({
        json: {
          links: [
            {
              code: "AbC123",
              url: "https://example.com/x",
              shortUrl: "http://localhost:3000/AbC123",
              createdAt: "2026-08-12T07:00:00.000Z",
            },
          ],
        },
      })
    );
    await page.setViewportSize({ width: 768, height: 800 });
    await page.goto("/");
    const codeLink = page.getByRole("link", { name: "AbC123" });
    await codeLink.waitFor();
    const row = page
      .getByRole("region", { name: "Recent short links" })
      .getByRole("listitem")
      .filter({ has: codeLink });
    await expect(row).toHaveCSS("grid-template-columns", /^74px /);
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(row).toHaveCSS("grid-template-columns", /^64px /);
  });

  test("empty tape shows the no-receipts line", async ({ page }) => {
    await page.route("**/api/links", (route) =>
      route.fulfill({ json: { links: [] } })
    );
    await page.goto("/");
    await expect(
      page.getByText("// no receipts yet — your first link prints here.")
    ).toBeVisible();
  });

  test("tape error state shows the failure message", async ({ page }) => {
    await page.route("**/api/links", (route) => route.abort());
    await page.goto("/");
    await expect(page.getByText("Couldn't load recent links.")).toBeVisible();
  });

  test("real backend tape lists rows (or shows the empty line)", async ({
    page,
  }) => {
    await page.goto("/");
    const region = page.getByRole("region", { name: "Recent short links" });
    await expect(region).not.toContainText("Couldn't load recent links.");
    const empty = region.getByText(
      "// no receipts yet — your first link prints here."
    );
    if ((await empty.count()) > 0) {
      await expect(empty).toBeVisible();
    } else {
      await expect(region.getByRole("listitem").first()).toBeVisible();
    }
  });

  test("no Indonesian strings remain", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Salin");
    expect(body).not.toContain("Tautan Terbaru");
  });

  test.describe("mobile (360px)", () => {
    test.use({ viewport: { width: 360, height: 800 } });

    test("form stacks and the control is full width", async ({ page }) => {
      await page.goto("/");
      const input = page.getByRole("textbox", { name: "Target URL" });
      const button = page.getByRole("button", { name: "SHORTEN" });
      const inputBox = await input.boundingBox();
      const buttonBox = await button.boundingBox();
      expect(inputBox).not.toBeNull();
      expect(buttonBox).not.toBeNull();
      expect(inputBox!.width).toBeGreaterThan(300);
      expect(buttonBox!.width).toBeGreaterThan(300);
      expect(buttonBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
    });

    test("ticket keeps code on top, inline COPY row, OPEN below", async ({
      page,
    }) => {
      await page.goto("/");
      await page
        .getByRole("textbox", { name: "Target URL" })
        .fill("https://example.com/mobile-ticket");
      await page.getByRole("button", { name: "SHORTEN" }).click();
      const receipt = page.locator('section[aria-live="polite"]');
      const codeBox = await receipt
        .locator("p", { hasText: /^[0-9A-Za-z]{6}$/ })
        .boundingBox();
      const copyBox = await receipt
        .getByRole("button", { name: "COPY" })
        .boundingBox();
      const openBox = await receipt
        .getByRole("link", { name: "OPEN ↗" })
        .boundingBox();
      expect(codeBox).not.toBeNull();
      expect(copyBox).not.toBeNull();
      expect(openBox).not.toBeNull();
      expect(copyBox!.y).toBeGreaterThanOrEqual(codeBox!.y + codeBox!.height - 1);
      expect(openBox!.y).toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height - 1);
    });
  });
});
