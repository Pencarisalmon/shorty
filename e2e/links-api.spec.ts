import { expect, test } from "@playwright/test";

test.describe("links deletion API", () => {
  test("DELETE /api/links/[code] returns 401 when unauthenticated", async ({
    request,
  }) => {
    const res = await request.delete("/api/links/anycode");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("accessing a non-existent or deleted short URL returns 404", async ({
    request,
  }) => {
    const res = await request.get("/nonexistentcode");
    expect(res.status()).toBe(404);
  });
});
