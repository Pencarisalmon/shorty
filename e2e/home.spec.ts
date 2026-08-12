import { expect, test } from "@playwright/test";

const STAMP_RGB = "rgb(216, 56, 46)";

test.describe("home page", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://localhost:3000",
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
    const slit = page.locator("form > div");
    await expect(slit).toHaveCSS("border-top-color", STAMP_RGB);
    await expect(slit).toHaveCSS("border-top-width", "2px");
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
    const receipt = page.locator('[data-slot="card"]');
    await expect(receipt).toBeVisible();
    const code = await receipt.locator("p").first().textContent();
    expect(code).toMatch(/^[0-9A-Za-z]{6}$/);
    await expect(receipt).toContainText("https://example.com/e2e-ticket");
    const open = receipt.getByRole("link", { name: "OPEN ↗" });
    await expect(open).toHaveAttribute("target", "_blank");
    await expect(open).toHaveAttribute("href", new RegExp(`/${code}$`));
  });

  test("COPY flips to COPIED ✓ for two seconds", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("textbox", { name: "Target URL" })
      .fill("https://example.com/e2e-copy");
    await page.getByRole("button", { name: "SHORTEN" }).click();
    const copy = page.getByRole("button", { name: "COPY" });
    await copy.click();
    await expect(
      page.getByRole("button", { name: "COPIED ✓" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "COPY" })).toBeVisible({
      timeout: 4000,
    });
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

    test("ticket copy drops full width below the code", async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("textbox", { name: "Target URL" })
        .fill("https://example.com/mobile-ticket");
      await page.getByRole("button", { name: "SHORTEN" }).click();
      const copy = page.getByRole("button", { name: "COPY" });
      const copyBox = await copy.boundingBox();
      expect(copyBox).not.toBeNull();
      expect(copyBox!.width).toBeGreaterThan(300);
      const code = page.locator('[data-slot="card"]').locator("p").first();
      const codeBox = await code.boundingBox();
      expect(codeBox).not.toBeNull();
      expect(copyBox!.y).toBeGreaterThanOrEqual(codeBox!.y + codeBox!.height);
    });
  });
});
