module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  testRegex: '(\\/__tests__\\/.*|(\\.|\\/))test\\.ts$',
  moduleFileExtensions: [
    'ts',
    'js',
    'json',
    'node',
  ],
  testEnvironment: 'node',
};
