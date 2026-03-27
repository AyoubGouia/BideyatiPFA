import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  globalSetup: "<rootDir>/tests/globalSetup.ts",
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};

export default config;

