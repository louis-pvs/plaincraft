import { useNotificationBadgeController } from "./useNotificationBadgeController";
import type {
  NotificationBadgeControllerProps,
  NotificationBadgeControllerState,
} from "./useNotificationBadgeController";

export type NotificationBadgeHeadlessProps =
  NotificationBadgeControllerProps & {
    children: (state: NotificationBadgeControllerState) => React.ReactNode;
  };

/**
 * NotificationBadgeHeadless
 * Render-prop component for custom views.
 * Exposes full controller state for maximum flexibility.
 */
export function NotificationBadgeHeadless(
  props: NotificationBadgeHeadlessProps,
) {
  const { children, ...controllerProps } = props;
  const state = useNotificationBadgeController(controllerProps);

  return <>{children(state)}</>;
}
