module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)', // 👈 allow Jest to transpile uuid
  ],
  moduleDirectories: [
    '<rootDir>/node_modules',
    '<rootDir>/../src/api/authorizer/node_modules',
    '<rootDir>/../src/api/users/node_modules',
  ],
};
