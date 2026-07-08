module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.spec.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { rootMode: 'upward' }],
  },
};
