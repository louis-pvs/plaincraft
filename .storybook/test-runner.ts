/**
 * Storybook Test Runner Configuration
 *
 * Configures Playwright-based test runner for interaction and a11y tests
 */

/** @type {import('@storybook/test-runner').TestRunnerConfig} */
export default {
  // Run tests in parallel for speed
  maxWorkers: 4,

  // Timeout for individual tests
  testTimeout: 30000,
};
