module.exports = {
  verbose: true,
  modulePathIgnorePatterns: ['<rootDir>/src/packages/[^/]+/build/'],
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  moduleNameMapper: {
    '^@misakey/([^/]+)/(.*)': '@misakey/$1/src/$2',
  },
  setupFiles: [
    './scripts/jest/setup/fetch.js',
  ],
};