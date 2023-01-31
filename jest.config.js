/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/**/__tests__/**/*test.[jt]s?(x)']
}