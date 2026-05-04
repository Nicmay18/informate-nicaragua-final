/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: ['src/js/**/*.js', 'public/js/**/*.js'],
  coverageDirectory: 'coverage'
};
