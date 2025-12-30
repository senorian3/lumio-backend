module.exports = {
  projects: [
    {
      displayName: 'lumio',
      rootDir: './apps/lumio',
      moduleNameMapper: {
        '^@lumio/(.*)$': '<rootDir>/src/$1',
        '^@libs/(.*)$': '<rootDir>/../../libs/$1',
        '^@files/(.*)$': '<rootDir>/../../apps/files/src/$1',
        '^generated/(.*)$': '<rootDir>/../../generated/$1',
      },
      testMatch: ['**/*.spec.ts'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.spec.json',
          },
        ],
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
      testEnvironment: 'node',
    },
    {
      displayName: 'files',
      rootDir: './apps/files',
      moduleNameMapper: {
        '^@files/(.*)$': '<rootDir>/src/$1',
        '^@libs/(.*)$': '<rootDir>/../../libs/$1',
        '^@lumio/(.*)$': '<rootDir>/../../apps/lumio/src/$1',
        '^generated/(.*)$': '<rootDir>/../../generated/$1',
      },
      testMatch: ['**/*.spec.ts'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.spec.json',
          },
        ],
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
      testEnvironment: 'node',
    },
  ],
  collectCoverage: false,
  coverageDirectory: './coverage',
  verbose: true,
};
