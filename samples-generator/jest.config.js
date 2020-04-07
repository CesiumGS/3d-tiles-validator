'use strict';
module.exports = {
    preset: 'ts-jest',
    clearMocks: true,
    coverageDirectory: 'coverage',
    testEnvironment: 'node',
    collectCoverageFrom: ['bin/**/*.ts', 'lib/**/*.ts', 'lib/**/*.js'],
    rootDir: '.',
    testMatch: [
        '<rootDir>/specs/**/__tests__/**/*.[jt]s?(x)',
        '<rootDir>/test/**/*(*.)@(spec|test).[tj]s?(x)'
    ],
    globals: {
        'ts-jest': {
          diagnostics: false,
          isolatedModules: true
        }
      }
};
