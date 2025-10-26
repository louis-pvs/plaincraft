import type { NotificationBadgeControllerState } from "./useNotificationBadgeController";

export type NotificationBadgeViewProps = {
  state: NotificationBadgeControllerState;
  label?: string;
  variant?: "default" | "primary" | "warning" | "danger";
  showDismiss?: boolean;
};

export function NotificationBadgeView(props: NotificationBadgeViewProps) {
  const {
    state,
    label = "Notifications",
    variant = "default",
    showDismiss = true,
  } = props;

  if (!state.hasNotifications) {
    return null;
  }

  // Variant styles
  const variantClasses = {
    default: "bg-slate-600 text-white hover:bg-slate-700",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    warning: "bg-amber-600 text-white hover:bg-amber-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        {...state.badgeProps}
        ref={state.badgeRef}
        onClick={state.handleBadgeClick}
        className={`inline-flex min-w-[2.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]}`}
        aria-label={`${state.count} ${label}`}
      >
        <span className="sr-only">{label}:</span>
        <span aria-hidden="true">{state.displayCount}</span>
        {state.status === "loading" && (
          <svg
            className="h-3 w-3 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
      </button>

      {showDismiss && (
        <button
          {...state.dismissButtonProps}
          ref={state.dismissRef}
          onClick={state.handleDismiss}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          title="Dismiss notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
