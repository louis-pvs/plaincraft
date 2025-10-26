import React, { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { TemplateSnippet } from "./TemplateSnippet";

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
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  nativeInputValueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("TemplateSnippet", () => {
  it("should render with default label", () => {
    const { container } = renderIntoDocument(<TemplateSnippet />);

    expect(container.textContent).toContain("Example");
  });

  it("should render with custom label", () => {
    const { container } = renderIntoDocument(
      <TemplateSnippet label="Custom Label" />,
    );

    expect(container.textContent).toContain("Custom Label");
  });

  it("should allow typing in input", () => {
    const { container } = renderIntoDocument(<TemplateSnippet />);

    const input = container.querySelector("input");
    expect(input).toBeTruthy();

    act(() => {
      setInputValue(input!, "hello");
    });

    expect(input!.value).toBe("hello");
  });

  it("should disable button when input is empty", () => {
    const { container } = renderIntoDocument(<TemplateSnippet />);

    const button = container.querySelector("button");
    expect(button?.disabled).toBe(true);
  });

  it("should enable button when input has value", () => {
    const { container } = renderIntoDocument(<TemplateSnippet />);

    const input = container.querySelector("input");
    const button = container.querySelector("button");

    act(() => {
      setInputValue(input!, "test");
    });

    expect(button?.disabled).toBe(false);
  });

  it("should call onAction when button is clicked", async () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    const { container } = renderIntoDocument(
      <TemplateSnippet onAction={onAction} />,
    );

    const input = container.querySelector("input");
    act(() => {
      setInputValue(input!, "test");
    });

    const button = container.querySelector("button");
    await act(async () => {
      button?.click();
    });

    expect(onAction).toHaveBeenCalledWith("test");
  });

  it("should show success message after successful action", async () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    const { container } = renderIntoDocument(
      <TemplateSnippet onAction={onAction} />,
    );

    const input = container.querySelector("input");
    act(() => {
      setInputValue(input!, "test");
    });

    const button = container.querySelector("button");
    await act(async () => {
      button?.click();
    });

    expect(container.textContent).toContain("Action completed successfully");
  });

  it("should show error message after failed action", async () => {
    const onAction = vi.fn().mockRejectedValue(new Error("Test error"));
    const { container } = renderIntoDocument(
      <TemplateSnippet onAction={onAction} />,
    );

    const input = container.querySelector("input");
    act(() => {
      setInputValue(input!, "test");
    });

    const button = container.querySelector("button");
    await act(async () => {
      button?.click();
    });

    expect(container.textContent).toContain("Test error");
  });

  it("should enforce maxLength", () => {
    const { container } = renderIntoDocument(<TemplateSnippet maxLength={5} />);

    const input = container.querySelector("input");
    act(() => {
      setInputValue(input!, "hello world");
    });

    expect(input!.value).toBe("hello");
  });
});
