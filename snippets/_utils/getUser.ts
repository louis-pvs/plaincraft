import { userEvent } from "storybook/test";

/**
 * getUser - Global slow user for Storybook interactions
 *
 * Simulates a realistic user with natural delays between actions.
 * Use this in play() functions to create recordable interactions.
 *
 * @param delay - Base delay between actions in milliseconds (default: 800ms)
 * @returns userEvent instance with configured delay
 */
export function getUser(delay = 800) {
  return userEvent.setup({ delay });
}
