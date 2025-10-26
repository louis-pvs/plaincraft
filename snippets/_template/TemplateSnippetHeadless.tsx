import { useTemplateSnippetController } from "./useTemplateSnippetController";
import type {
  TemplateSnippetControllerProps,
  TemplateSnippetControllerState,
} from "./useTemplateSnippetController";

export type TemplateSnippetHeadlessProps = TemplateSnippetControllerProps & {
  children: (state: TemplateSnippetControllerState) => React.ReactNode;
};

/**
 * TemplateSnippetHeadless
 * Render-prop component for custom views.
 * Exposes full controller state for maximum flexibility.
 */
export function TemplateSnippetHeadless(props: TemplateSnippetHeadlessProps) {
  const { children, ...controllerProps } = props;
  const state = useTemplateSnippetController(controllerProps);

  return <>{children(state)}</>;
}
