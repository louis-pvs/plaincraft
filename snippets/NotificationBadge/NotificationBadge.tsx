import { useNotificationBadgeController } from "./useNotificationBadgeController";
import type { NotificationBadgeControllerProps } from "./useNotificationBadgeController";
import { NotificationBadgeView } from "./NotificationBadgeView";

/**
 * NotificationBadge
 * A notification badge counter with dismiss functionality.
 *
 * Architecture: Headless controller hook + pluggable view.
 * Seams: data and callbacks passed via props. No fetching.
 * Invariants: count >= 0, maxCount >= 1.
 * A11y: keyboard and screen reader paths with proper ARIA labels.
 */
export type NotificationBadgeProps = NotificationBadgeControllerProps & {
  label?: string;
  variant?: "default" | "primary" | "warning" | "danger";
  showDismiss?: boolean;
};

export function NotificationBadge(props: NotificationBadgeProps) {
  const { label, variant, showDismiss, ...controllerProps } = props;
  const state = useNotificationBadgeController(controllerProps);

  return (
    <NotificationBadgeView
      state={state}
      label={label}
      variant={variant}
      showDismiss={showDismiss}
    />
  );
}

/**
 * Demo
 * Tiny harness used by the demo app. Keeps one source of truth.
 */
export function Demo() {
  return (
    <div className="space-y-4">
      <NotificationBadge
        count={5}
        label="Messages"
        variant="primary"
        onClick={() => {
          if (import.meta.env.DEV) {
            console.info("Badge clicked");
          }
          return Promise.resolve();
        }}
        onDismiss={() => {
          if (import.meta.env.DEV) {
            console.info("Notifications dismissed");
          }
          return Promise.resolve();
        }}
      />
      <NotificationBadge count={125} label="Updates" variant="danger" />
    </div>
  );
}
