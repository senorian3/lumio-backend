module.exports = {
  projects: [
    {
      name: 'lumio',
      displayName: 'lumio',
      rootDir: './apps/lumio',
      moduleNameMapper: {
        '^@lumio/(.*)$': '<rootDir>/src/$1',
        '^@libs/(.*)$': '<rootDir>/../../libs/$1',
        '^@files/(.*)$': '<rootDir>/../../apps/files/src/$1',
      },
      testMatch: ['**/*.spec.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
      testEnvironment: 'node',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/tsconfig.spec.json',
        },
      },
    },
    {
      name: 'files',
      displayName: 'files',
      rootDir: './apps/files',
      moduleNameMapper: {
        '^@files/(.*)$': '<rootDir>/src/$1',
        '^@libs/(.*)$': '<rootDir>/../../libs/$1',
        '^@lumio/(.*)$': '<rootDir>/../../apps/lumio/src/$1',
      },
      testMatch: ['**/*.spec.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
      testEnvironment: 'node',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/tsconfig.spec.json',
        },
      },
    },
  ],
  collectCoverage: false,
  coverageDirectory: './coverage',
  verbose: true,
};
