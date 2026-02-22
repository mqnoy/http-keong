module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    '^middlewares/(.*)$': '<rootDir>/middlewares/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['**/tests/**/*.test.ts'],
};
