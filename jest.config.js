/** @type {import('jest').Config} */
export default {
  // Use jsdom for browser-like environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'assets/js/**/*.js',
    '!assets/js/**/*.min.js',
    '!assets/js/vendor/**',
    '!assets/js/jszip.min.js',
    '!assets/js/xlsx.full.min.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', 'assets/js'],
  
  // Transform files (we're using ES modules)
  transform: {},
  
  // Coverage thresholds (start conservative, increase over time)
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 25,
      functions: 30,
      lines: 30
    }
  },
  
  // Verbose output
  verbose: true
};
