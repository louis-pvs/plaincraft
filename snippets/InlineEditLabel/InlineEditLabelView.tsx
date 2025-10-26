import React from "react";
import type { InlineEditLabelControllerState } from "./useInlineEditLabelController";

export type InlineEditLabelViewProps = {
  controller: InlineEditLabelControllerState;
  ariaLabel?: string;
  maxLength: number;
};

export function InlineEditLabelView({
  controller,
  ariaLabel = "Edit label",
  maxLength,
}: InlineEditLabelViewProps) {
  const {
    displayValue,
    draft,
    isEditing,
    status,
    message,
    inputId,
    inputRef,
    beginEditing,
    updateDraft,
    handleDisplayKeyDown,
    handleInputKeyDown,
    handleBlur,
  } = controller;

  const messageTone =
    status === "error"
      ? "text-rose-600"
      : status === "success"
        ? "text-emerald-600"
        : status === "saving"
          ? "text-slate-700"
          : "text-slate-700";

  return (
    <div className="w-full max-w-sm space-y-2 text-slate-950">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-700">
        Inline label
      </div>
      {!isEditing && (
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onClick={beginEditing}
          onKeyDown={handleDisplayKeyDown}
          className="flex items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition outline-none focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          <span className="truncate">{displayValue}</span>
          <span className="ml-3 text-xs text-slate-500">Enter to edit</span>
        </div>
      )}
      {isEditing && (
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            value={draft}
            onChange={(event) => updateDraft(event.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleInputKeyDown}
            maxLength={maxLength}
            disabled={status === "saving"}
            aria-busy={status === "saving"}
            aria-describedby={`${inputId}-hint`}
            aria-label={ariaLabel}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-wait disabled:bg-slate-100"
            placeholder="Update label"
          />
          {status === "saving" && (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      )}
      <div
        id={`${inputId}-hint`}
        className="text-xs text-slate-700"
        aria-live="polite"
      >
        {isEditing
          ? "Enter to save, Esc to cancel, clicks outside save."
          : `Press Enter or click to edit. Max ${maxLength} characters.`}
      </div>
      {message && (
        <div
          className={`${messageTone} text-xs`}
          role={status === "error" ? "alert" : "status"}
          aria-live={status === "error" ? "assertive" : "polite"}
        >
          {message}
        </div>
      )}
    </div>
  );
}
