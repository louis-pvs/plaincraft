import React from "react";
import {
  useInlineEditLabelController,
  type InlineEditLabelControllerProps,
  type InlineEditLabelControllerState,
} from "./useInlineEditLabelController";

export type InlineEditLabelHeadlessProps = InlineEditLabelControllerProps & {
  children: (controller: InlineEditLabelControllerState) => React.ReactElement;
};

/**
 * Headless version of InlineEditLabel that provides full customization
 * through render props. Use this when you want to bring your own UI
 * framework or design system.
 *
 * @example
 * ```tsx
 * <InlineEditLabelHeadless
 *   value={value}
 *   maxLength={32}
 *   onSave={handleSave}
 * >
 *   {(controller) => (
 *     <div>
 *       {controller.isEditing ? (
 *         <input
 *           ref={controller.inputRef}
 *           value={controller.draft}
 *           onChange={(e) => controller.updateDraft(e.target.value)}
 *           onBlur={controller.handleBlur}
 *         />
 *       ) : (
 *         <button onClick={controller.beginEditing}>
 *           {controller.displayValue}
 *         </button>
 *       )}
 *     </div>
 *   )}
 * </InlineEditLabelHeadless>
 * ```
 */
export function InlineEditLabelHeadless({
  value,
  maxLength,
  onSave,
  labels,
  children,
}: InlineEditLabelHeadlessProps) {
  const controller = useInlineEditLabelController({
    value,
    maxLength,
    onSave,
    labels,
  });

  return children(controller);
}
