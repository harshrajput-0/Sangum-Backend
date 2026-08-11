import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000, // MongoMemoryServer's first boot can be slow
    hookTimeout: 20000,
  },
});