import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const port = new URL(baseURL).port || "3000";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
  },
  webServer: {
    command: `pnpm build && PORT=${port} pnpm start`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
