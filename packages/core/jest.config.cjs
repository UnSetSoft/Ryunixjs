module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
    '^.+\\.ryx$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'ryx'],
  moduleNameMapper: {
    '^\\.\\./main\\.js$': '<rootDir>/.generated/main.js',
    '^\\.\\./lib/(.*)$': '<rootDir>/.generated/lib/$1',
    '^\\.\\./utils/(.*)$': '<rootDir>/.generated/utils/$1',
  },
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}
