/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  rootDir: __dirname,
  coveragePathIgnorePatterns: ['<rootDir>/src/__tests__/helpers'],
  testMatch: ['<rootDir>/**/__tests__/**/*test.[jt]s']
}