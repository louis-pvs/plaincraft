import React, { useEffect, useId, useRef, useState } from "react";

type SaveStatus = "idle" | "saving" | "success" | "error";

export type InlineEditLabelProps = {
  value: string;
  maxLength: number;
  /**
   * Seam: inject the save handler from the parent.
   */
  onSave: (nextValue: string) => Promise<void> | void;
  /**
   * Accessible label announced while the text is in read-only mode.
   */
  ariaLabel?: string;
  savingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
};

export function InlineEditLabel({
  value,
  maxLength,
  onSave,
  ariaLabel = "Edit label",
  savingLabel = "Saving…",
  successLabel = "Saved",
  errorLabel = "Save failed. Try again.",
}: InlineEditLabelProps) {
  if (import.meta.env.DEV) {
    if (maxLength < 1) {
      console.warn("InlineEditLabel: maxLength should be at least 1.");
    }
    if (value.trim().length > maxLength) {
      console.warn(
        "InlineEditLabel: trimmed value should not exceed maxLength.",
      );
    }
    if (typeof onSave !== "function") {
      console.warn("InlineEditLabel: onSave must be a function.");
    }
  }

  const [displayValue, setDisplayValue] = useState(value);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelNextSave = useRef(false);
  const previousValueRef = useRef(value);

  useEffect(() => {
    setDisplayValue(value);
    previousValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [isEditing]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }
    const timer = window.setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [status]);

  const beginEditing = () => {
    setMessage("");
    setDraft(displayValue);
    setIsEditing(true);
  };

  const handleDisplayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      beginEditing();
    }
  };

  const saveDraft = async () => {
    if (!isEditing) {
      return;
    }

    const trimmed = draft.trim();
    if (trimmed.length > maxLength) {
      setStatus("error");
      setMessage(`Keep it under ${maxLength} characters.`);
      return;
    }

    if (trimmed === displayValue) {
      setIsEditing(false);
      setMessage("");
      return;
    }

    const previousValue = previousValueRef.current;

    setStatus("saving");
    setMessage(savingLabel);
    setDisplayValue(trimmed);

    try {
      await onSave(trimmed);
      previousValueRef.current = trimmed;
      setStatus("success");
      setMessage(successLabel);
      setIsEditing(false);
      setDraft(trimmed);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      setStatus("error");
      setMessage(errorLabel);
      setDisplayValue(previousValue);
      setDraft(previousValue);
      setIsEditing(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveDraft();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelNextSave.current = true;
      setIsEditing(false);
      setStatus("idle");
      setMessage("Changes discarded.");
      setDraft(displayValue);
    }
  };

  const handleBlur = () => {
    if (cancelNextSave.current) {
      cancelNextSave.current = false;
      return;
    }
    void saveDraft();
  };

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
            onChange={(event) =>
              setDraft(event.target.value.slice(0, maxLength))
            }
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

export function Demo() {
  const [label, setLabel] = useState("Team charter");
  const [edgeLabel, setEdgeLabel] = useState("Launch plan");
  const [shouldFailOnce, setShouldFailOnce] = useState(true);

  const saveWithDelay = async (nextValue: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLabel(nextValue);
  };

  const saveWithRetry = async (nextValue: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (shouldFailOnce) {
      setShouldFailOnce(false);
      throw new Error("Simulated failure");
    }
    setEdgeLabel(nextValue);
  };

  return (
    <div className="space-y-6">
      <InlineEditLabel
        value={label}
        maxLength={32}
        onSave={saveWithDelay}
        ariaLabel="Edit team charter"
      />
      <div className="space-y-2">
        <InlineEditLabel
          value={edgeLabel}
          maxLength={16}
          onSave={saveWithRetry}
          ariaLabel="Edit launch plan"
          errorLabel="Save failed. Retry to continue."
        />
        <p className="text-xs text-slate-700">
          The second label fails once to highlight the retry path.
        </p>
      </div>
    </div>
  );
}
