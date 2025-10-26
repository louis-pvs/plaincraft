import React, { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { InlineEditLabel } from "./InlineEditLabel";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderIntoDocument(ui: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

function setInputValue(element: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  );
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("InlineEditLabel", () => {
  it("renders and respects invariants", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { container, root } = renderIntoDocument(
      <InlineEditLabel
        value="Label exceeding max"
        maxLength={4}
        onSave={vi.fn()}
      />,
    );

    const button = container.querySelector('[role="button"]');
    expect(button).not.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "InlineEditLabel: trimmed value should not exceed maxLength.",
    );

    act(() => {
      root.unmount();
    });
    container.remove();
    warn.mockRestore();
  });

  it("emits callbacks or state changes on primary action", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onSave = vi
      .fn<(value: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce(undefined);

    const { container, root } = renderIntoDocument(
      <InlineEditLabel value="Team motto" maxLength={32} onSave={onSave} />,
    );

    const button = container.querySelector('[role="button"]');
    expect(button).not.toBeNull();

    act(() => {
      button?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    await vi.waitFor(() => {
      expect(container.querySelector("input")).not.toBeNull();
    });

    const getInput = () =>
      container.querySelector("input") as HTMLInputElement | null;
    expect(getInput()).not.toBeNull();
    act(() => {
      getInput()?.focus();
    });

    act(() => {
      const current = getInput();
      if (current) {
        setInputValue(current, "Ship the feature");
      }
    });

    await act(async () => {
      getInput()?.blur();
    });
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(onSave).toHaveBeenCalledWith("Ship the feature");
    expect(container.textContent).toContain("Save failed");

    act(() => {
      const current = getInput();
      if (current) {
        current.focus();
        setInputValue(current, "Ship the feature");
      }
    });

    await act(async () => {
      getInput()?.blur();
    });
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(2);
    });

    expect(container.textContent).toContain("Saved");
    expect(container.textContent).toContain("Ship the feature");

    act(() => {
      root.unmount();
    });
    container.remove();
    error.mockRestore();
  });
});
