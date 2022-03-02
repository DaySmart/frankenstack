module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ["<rootDir>/@(generated|src)/**/*(*.)@(spec|test).[tj]s?(x)"] // ["<rootDir>/**/?(*.)(spec|test).{js,jsx,ts,tsx}"] 
};
