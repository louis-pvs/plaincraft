import React, { useId, useRef, useState } from "react";

/**
 * TemplateSnippet
 * One file UX snippet template.
 *
 * Seams: data and callbacks passed via props. No fetching.
 * Invariants: guard props at the top in dev builds.
 * A11y: keyboard and screen reader paths provided.
 */
export type TemplateSnippetProps = {
  label?: string;
  onAction?: () => void | Promise<void>;
  max?: number; // example invariant
};

export function TemplateSnippet(props: TemplateSnippetProps) {
  const { label = "Example", onAction, max = 140 } = props;

  if (import.meta.env.DEV && max < 1) {
    // Invariant guard in dev only
    // eslint-disable-next-line no-console
    console.warn("TemplateSnippet: max should be >= 1");
  }

  const [value, setValue] = useState("");
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);

  async function handleClick() {
    try {
      await onAction?.();
      // eslint-disable-next-line no-console
      if (import.meta.env.DEV) console.log("Action complete");
    } catch {
      // eslint-disable-next-line no-console
      if (import.meta.env.DEV) console.log("Action failed, ignore for template");
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm text-slate-700">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, max))}
        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        placeholder="Type something"
        aria-describedby={id + "-hint"}
      />
      <div id={id + "-hint"} className="text-xs text-slate-700">
        Max {max} characters
      </div>
      <button
        ref={btnRef}
        onClick={handleClick}
        className="rounded-md bg-slate-950 px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        aria-live="polite"
      >
        Do action
      </button>
    </div>
  );
}

/**
 * Demo
 * Tiny harness used by the demo app. Keeps one source of truth.
 */
export function Demo() {
  return <TemplateSnippet onAction={() => Promise.resolve()} />;
}
