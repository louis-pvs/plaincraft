import React, { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { useInlineEditLabelController } from "./useInlineEditLabelController";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("useInlineEditLabelController", () => {
  it("initializes with correct state and exports actions", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onSave = vi.fn();

    let controllerState:
      | ReturnType<typeof useInlineEditLabelController>
      | undefined;

    function TestComponent() {
      controllerState = useInlineEditLabelController({
        value: "Team charter",
        maxLength: 32,
        onSave,
      });
      return null;
    }

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState).toBeDefined();
    expect(controllerState!.displayValue).toBe("Team charter");
    expect(controllerState!.isEditing).toBe(false);
    expect(controllerState!.status).toBe("idle");
    expect(controllerState!.beginEditing).toBeInstanceOf(Function);
    expect(controllerState!.saveDraft).toBeInstanceOf(Function);
    expect(controllerState!.cancelEditing).toBeInstanceOf(Function);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("warns in dev mode when invariants are violated", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    function TestComponent() {
      useInlineEditLabelController({
        value: "Too long value",
        maxLength: 5,
        onSave: vi.fn(),
      });
      return null;
    }

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(warn).toHaveBeenCalledWith(
      "InlineEditLabel: trimmed value should not exceed maxLength.",
    );

    act(() => {
      root.unmount();
    });
    container.remove();
    warn.mockRestore();
  });

  it("transitions to edit mode and updates draft", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onSave = vi.fn();

    let controllerState:
      | ReturnType<typeof useInlineEditLabelController>
      | undefined;

    function TestComponent() {
      controllerState = useInlineEditLabelController({
        value: "Team charter",
        maxLength: 32,
        onSave,
      });
      return null;
    }

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState!.isEditing).toBe(false);

    act(() => {
      controllerState!.beginEditing();
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState!.isEditing).toBe(true);

    act(() => {
      controllerState!.updateDraft("New value");
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState!.draft).toBe("New value");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("enforces maxLength when updating draft", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let controllerState:
      | ReturnType<typeof useInlineEditLabelController>
      | undefined;

    function TestComponent() {
      controllerState = useInlineEditLabelController({
        value: "Short",
        maxLength: 10,
        onSave: vi.fn(),
      });
      return null;
    }

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    act(() => {
      controllerState!.updateDraft("This is way too long");
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState!.draft).toBe("This is wa");
    expect(controllerState!.draft.length).toBe(10);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("saves successfully and shows success message", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onSave = vi.fn().mockResolvedValue(undefined);

    let controllerState:
      | ReturnType<typeof useInlineEditLabelController>
      | undefined;

    function TestComponent() {
      controllerState = useInlineEditLabelController({
        value: "Original",
        maxLength: 32,
        onSave,
      });
      return null;
    }

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    act(() => {
      controllerState!.beginEditing();
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    act(() => {
      controllerState!.updateDraft("Updated");
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    await act(async () => {
      await controllerState!.saveDraft();
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(onSave).toHaveBeenCalledWith("Updated");
    expect(controllerState!.status).toBe("success");
    expect(controllerState!.message).toBe("Saved");
    expect(controllerState!.messageTone).toBe("success");
    expect(controllerState!.isEditing).toBe(false);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("handles save errors and restores previous value", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onSave = vi.fn().mockRejectedValue(new Error("Network error"));

    let controllerState:
      | ReturnType<typeof useInlineEditLabelController>
      | undefined;

    function TestComponent() {
      controllerState = useInlineEditLabelController({
        value: "Original",
        maxLength: 32,
        onSave,
      });
      return null;
    }

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    act(() => {
      controllerState!.beginEditing();
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    act(() => {
      controllerState!.updateDraft("Failed");
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    await act(async () => {
      await controllerState!.saveDraft();
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState!.status).toBe("error");
    expect(controllerState!.message).toBe("Save failed. Try again.");
    expect(controllerState!.messageTone).toBe("error");
    expect(controllerState!.displayValue).toBe("Original");
    expect(controllerState!.isEditing).toBe(true);

    act(() => {
      root.unmount();
    });
    container.remove();
    error.mockRestore();
  });

  it("uses custom labels", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let controllerState:
      | ReturnType<typeof useInlineEditLabelController>
      | undefined;

    function TestComponent() {
      controllerState = useInlineEditLabelController({
        value: "Test",
        maxLength: 32,
        onSave: vi.fn(),
        labels: {
          saving: "Processing...",
          success: "Done!",
          error: "Failed!",
          discarded: "Cancelled",
        },
      });
      return null;
    }

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    act(() => {
      controllerState!.beginEditing();
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    act(() => {
      controllerState!.cancelEditing();
    });

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState!.message).toBe("Cancelled");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
