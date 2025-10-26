import { useTemplateSnippetController } from "./useTemplateSnippetController";
import type { TemplateSnippetControllerProps } from "./useTemplateSnippetController";
import { TemplateSnippetView } from "./TemplateSnippetView";

/**
 * TemplateSnippet
 * One file UX snippet template following SOLID architecture.
 *
 * Architecture: Headless controller hook + pluggable view.
 * Seams: data and callbacks passed via props. No fetching.
 * Invariants: guard props at the top in dev builds.
 * A11y: keyboard and screen reader paths provided.
 */
export type TemplateSnippetProps = TemplateSnippetControllerProps & {
  label?: string;
};

export function TemplateSnippet(props: TemplateSnippetProps) {
  const { label, ...controllerProps } = props;
  const state = useTemplateSnippetController(controllerProps);

  return <TemplateSnippetView state={state} label={label} />;
}

/**
 * Demo
 * Tiny harness used by the demo app. Keeps one source of truth.
 */
export function Demo() {
  return (
    <TemplateSnippet
      label="Example Input"
      onAction={(value) => {
        if (import.meta.env.DEV) {
          console.info("Action triggered with value:", value);
        }
        return Promise.resolve();
      }}
    />
  );
}
