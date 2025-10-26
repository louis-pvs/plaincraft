import { useEffect, useId, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "success" | "error";

export type InlineEditLabelControllerProps = {
  value: string;
  maxLength: number;
  onSave: (nextValue: string) => Promise<void> | void;
  labels?: {
    saving?: string;
    success?: string;
    error?: string;
    discarded?: string;
  };
};

export type InlineEditLabelControllerState = {
  // Display and draft state
  displayValue: string;
  draft: string;
  isEditing: boolean;

  // Save lifecycle
  status: SaveStatus;
  message: string;
  messageTone: "error" | "success" | "info";

  // Refs for imperative control
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement>;

  // Derived props for input
  inputProps: {
    id: string;
    value: string;
    maxLength: number;
    disabled: boolean;
    "aria-busy": boolean;
    "aria-describedby": string;
  };

  // Actions
  beginEditing: () => void;
  saveDraft: () => Promise<void>;
  cancelEditing: () => void;
  updateDraft: (value: string) => void;
  handleDisplayKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
};

export function useInlineEditLabelController({
  value,
  maxLength,
  onSave,
  labels = {},
}: InlineEditLabelControllerProps): InlineEditLabelControllerState {
  // Runtime guards
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

  const savingLabel = labels.saving ?? "Saving…";
  const successLabel = labels.success ?? "Saved";
  const errorLabel = labels.error ?? "Save failed. Try again.";
  const discardedLabel = labels.discarded ?? "Changes discarded.";

  const [displayValue, setDisplayValue] = useState(value);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelNextSave = useRef(false);
  const previousValueRef = useRef(value);

  // Sync display value when external value changes
  useEffect(() => {
    setDisplayValue(value);
    previousValueRef.current = value;
  }, [value]);

  // Reset draft when entering edit mode
  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [isEditing, value]);

  // Auto-focus and select input when entering edit mode
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

  // Clear success message after timeout
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

  const cancelEditing = () => {
    cancelNextSave.current = true;
    setIsEditing(false);
    setStatus("idle");
    setMessage(discardedLabel);
    setDraft(displayValue);
  };

  const handleDisplayKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      beginEditing();
    }
  };

  const updateDraft = (value: string) => {
    setDraft(value.slice(0, maxLength));
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
      cancelEditing();
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
    status === "error" ? "error" : status === "success" ? "success" : "info";

  return {
    displayValue,
    draft,
    isEditing,
    status,
    message,
    messageTone,
    inputId,
    inputRef,
    inputProps: {
      id: inputId,
      value: draft,
      maxLength,
      disabled: status === "saving",
      "aria-busy": status === "saving",
      "aria-describedby": `${inputId}-hint`,
    },
    beginEditing,
    saveDraft,
    cancelEditing,
    updateDraft,
    handleDisplayKeyDown,
    handleInputKeyDown,
    handleBlur,
  };
}
