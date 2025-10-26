import type { TemplateSnippetControllerState } from "./useTemplateSnippetController";

export type TemplateSnippetViewProps = {
  state: TemplateSnippetControllerState;
  label?: string;
};

export function TemplateSnippetView(props: TemplateSnippetViewProps) {
  const { state, label = "Example" } = props;

  return (
    <div className="space-y-2">
      <label
        htmlFor={state.inputId}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <input
        {...state.inputProps}
        ref={state.inputRef}
        onChange={(e) => state.updateValue(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Type something..."
      />
      <div id={`${state.inputId}-hint`} className="text-xs text-slate-600">
        Max {state.inputProps.maxLength} characters
      </div>
      {state.message && (
        <div
          id={`${state.inputId}-message`}
          className={`text-sm ${
            state.messageTone === "error"
              ? "text-red-600"
              : state.messageTone === "success"
                ? "text-green-600"
                : "text-slate-600"
          }`}
          role={state.messageTone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.message}
        </div>
      )}
      <button
        {...state.buttonProps}
        ref={state.buttonRef}
        onClick={state.handleAction}
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.status === "loading" && (
          <svg
            className="h-4 w-4 animate-spin"
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
        {state.status === "loading" ? "Processing..." : "Do Action"}
      </button>
    </div>
  );
}
