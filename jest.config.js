/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

module.exports = config;
