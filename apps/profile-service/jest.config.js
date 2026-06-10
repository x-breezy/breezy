/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  testTimeout: 30000,
  coverageReporters: ["lcov", "text", "html"],
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/config/**",
    "!src/tests/**",
  ],
}
