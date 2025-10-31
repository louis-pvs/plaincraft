import React, { useState } from "react";
import { useInlineEditLabelController } from "./useInlineEditLabelController";
import { InlineEditLabelView } from "./InlineEditLabelView";

// Re-export types and components for convenience
export { useInlineEditLabelController } from "./useInlineEditLabelController";
export { InlineEditLabelView } from "./InlineEditLabelView";
export { InlineEditLabelHeadless } from "./InlineEditLabelHeadless";
export type {
  InlineEditLabelControllerProps,
  InlineEditLabelControllerState,
  SaveStatus,
} from "./useInlineEditLabelController";

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
  /**
   * @deprecated Use `labels.saving` instead
   */
  savingLabel?: string;
  /**
   * @deprecated Use `labels.success` instead
   */
  successLabel?: string;
  /**
   * @deprecated Use `labels.error` instead
   */
  errorLabel?: string;
  /**
   * Optional label overrides for different states
   */
  labels?: {
    saving?: string;
    success?: string;
    error?: string;
    discarded?: string;
  };
  /**
   * Placeholder shown when the current value is empty.
   */
  emptyValuePlaceholder?: string;
};

export function InlineEditLabel({
  value,
  maxLength,
  onSave,
  ariaLabel = "Edit label",
  savingLabel,
  successLabel,
  errorLabel,
  labels,
  emptyValuePlaceholder = "Add label",
}: InlineEditLabelProps) {
  const controller = useInlineEditLabelController({
    value,
    maxLength,
    onSave,
    labels: {
      saving: labels?.saving ?? savingLabel,
      success: labels?.success ?? successLabel,
      error: labels?.error ?? errorLabel,
      discarded: labels?.discarded,
    },
  });

  return (
    <InlineEditLabelView
      controller={controller}
      ariaLabel={ariaLabel}
      maxLength={maxLength}
      emptyValuePlaceholder={emptyValuePlaceholder}
    />
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
