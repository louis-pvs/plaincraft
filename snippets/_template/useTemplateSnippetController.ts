import { useId, useRef, useState } from "react";

export type ActionStatus = "idle" | "loading" | "success" | "error";

export type TemplateSnippetControllerProps = {
  label?: string;
  maxLength?: number;
  onAction?: (value: string) => Promise<void> | void;
};

export type TemplateSnippetControllerState = {
  // State
  value: string;
  status: ActionStatus;
  message: string;
  messageTone: "info" | "success" | "error";

  // Refs
  inputId: string;
  buttonId: string;
  inputRef: React.RefObject<HTMLInputElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;

  // Derived props
  inputProps: {
    id: string;
    value: string;
    maxLength: number;
    disabled: boolean;
    "aria-describedby": string;
  };

  buttonProps: {
    id: string;
    disabled: boolean;
    "aria-busy": boolean;
  };

  // Actions
  updateValue: (nextValue: string) => void;
  handleAction: () => Promise<void>;
  clearMessage: () => void;
};

export function useTemplateSnippetController(
  props: TemplateSnippetControllerProps,
): TemplateSnippetControllerState {
  const { maxLength = 140, onAction } = props;

  // Runtime guards (development only)
  if (import.meta.env.DEV) {
    if (maxLength < 1) {
      console.warn("useTemplateSnippetController: maxLength should be >= 1");
    }
  }

  // State
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">(
    "info",
  );

  // Refs
  const inputId = useId();
  const buttonId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Actions
  function updateValue(nextValue: string) {
    const trimmed = nextValue.slice(0, maxLength);
    setValue(trimmed);

    if (message) {
      setMessage("");
    }
  }

  async function handleAction() {
    if (!onAction || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      await onAction(value);
      setStatus("success");
      setMessage("Action completed successfully");
      setMessageTone("success");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Action failed");
      setMessageTone("error");
    }
  }

  function clearMessage() {
    setMessage("");
    setStatus("idle");
  }

  // Derived props
  const inputProps = {
    id: inputId,
    value,
    maxLength,
    disabled: status === "loading",
    "aria-describedby": `${inputId}-hint ${inputId}-message`,
  };

  const buttonProps = {
    id: buttonId,
    disabled: status === "loading" || !value.trim(),
    "aria-busy": status === "loading",
  };

  return {
    // State
    value,
    status,
    message,
    messageTone,

    // Refs
    inputId,
    buttonId,
    inputRef,
    buttonRef,

    // Derived props
    inputProps,
    buttonProps,

    // Actions
    updateValue,
    handleAction,
    clearMessage,
  };
}
