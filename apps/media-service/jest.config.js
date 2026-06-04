/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  // mongodb-memory-server downloads + boots a binary; give it room.
  testTimeout: 30000,
}
