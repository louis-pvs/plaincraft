import { useId, useRef, useState } from "react";

export type ActionStatus = "idle" | "loading" | "success" | "error";

export type NotificationBadgeControllerProps = {
  /** Initial count of notifications */
  count?: number;
  /** Maximum count to display before showing "99+" */
  maxCount?: number;
  /** Callback when the badge is clicked */
  onClick?: () => Promise<void> | void;
  /** Callback when dismiss is triggered */
  onDismiss?: () => Promise<void> | void;
  /** Badge variant style */
  variant?: "default" | "primary" | "warning" | "danger";
  /** Show dismiss button */
  showDismiss?: boolean;
};

export type NotificationBadgeControllerState = {
  // State
  count: number;
  status: ActionStatus;
  dismissed: boolean;

  // Refs
  badgeId: string;
  dismissButtonId: string;
  badgeRef: React.RefObject<HTMLButtonElement>;
  dismissRef: React.RefObject<HTMLButtonElement>;

  // Derived
  displayCount: string;
  hasNotifications: boolean;

  // Props for elements
  badgeProps: {
    id: string;
    role: "status";
    "aria-live": "polite";
    "aria-atomic": "true";
    disabled: boolean;
    "aria-busy": boolean;
  };

  dismissButtonProps: {
    id: string;
    "aria-label": string;
    disabled: boolean;
  };

  // Actions
  handleBadgeClick: () => Promise<void>;
  handleDismiss: () => Promise<void>;
  resetBadge: () => void;
};

export function useNotificationBadgeController(
  props: NotificationBadgeControllerProps,
): NotificationBadgeControllerState {
  const {
    count: initialCount = 0,
    maxCount = 99,
    onClick,
    onDismiss,
    showDismiss = true,
  } = props;

  // Runtime guards (development only)
  if (import.meta.env.DEV) {
    if (maxCount < 1) {
      console.warn("useNotificationBadgeController: maxCount should be >= 1");
    }
    if (initialCount < 0) {
      console.warn("useNotificationBadgeController: count should be >= 0");
    }
  }

  // State
  const [count] = useState(Math.max(0, initialCount));
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [dismissed, setDismissed] = useState(false);

  // Refs
  const badgeId = useId();
  const dismissButtonId = useId();
  const badgeRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);

  // Derived
  const hasNotifications = count > 0 && !dismissed;
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Actions
  async function handleBadgeClick() {
    if (!onClick || status === "loading" || dismissed) return;

    setStatus("loading");

    try {
      await onClick();
      setStatus("success");
    } catch (error) {
      setStatus("error");
      if (import.meta.env.DEV) {
        console.error("Badge click failed:", error);
      }
    } finally {
      // Reset status after a brief delay
      setTimeout(() => setStatus("idle"), 300);
    }
  }

  async function handleDismiss() {
    if (!showDismiss || status === "loading" || dismissed) return;

    setStatus("loading");

    try {
      if (onDismiss) {
        await onDismiss();
      }
      setDismissed(true);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      if (import.meta.env.DEV) {
        console.error("Dismiss failed:", error);
      }
      // Reset status on error
      setTimeout(() => setStatus("idle"), 300);
    }
  }

  function resetBadge() {
    setDismissed(false);
    setStatus("idle");
  }

  // Derived props
  const badgeProps = {
    id: badgeId,
    role: "status" as const,
    "aria-live": "polite" as const,
    "aria-atomic": "true" as const,
    disabled: status === "loading" || dismissed,
    "aria-busy": status === "loading",
  };

  const dismissButtonProps = {
    id: dismissButtonId,
    "aria-label": "Dismiss notifications",
    disabled: status === "loading" || dismissed,
  };

  return {
    // State
    count,
    status,
    dismissed,

    // Refs
    badgeId,
    dismissButtonId,
    badgeRef,
    dismissRef,

    // Derived
    displayCount,
    hasNotifications,

    // Props
    badgeProps,
    dismissButtonProps,

    // Actions
    handleBadgeClick,
    handleDismiss,
    resetBadge,
  };
}
