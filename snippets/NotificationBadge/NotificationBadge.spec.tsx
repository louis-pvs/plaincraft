import React, { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { NotificationBadge } from "./NotificationBadge";

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

describe("NotificationBadge", () => {
  it("should render with count", () => {
    const { container } = renderIntoDocument(<NotificationBadge count={5} />);
    expect(container.textContent).toContain("5");
  });

  it("should not render when count is 0", () => {
    const { container } = renderIntoDocument(<NotificationBadge count={0} />);
    const button = container.querySelector("button");
    expect(button).toBeNull();
  });

  it("should display 99+ when count exceeds maxCount", () => {
    const { container } = renderIntoDocument(
      <NotificationBadge count={150} maxCount={99} />,
    );
    expect(container.textContent).toContain("99+");
  });

  it("should call onClick when badge is clicked", async () => {
    const onClick = vi.fn().mockResolvedValue(undefined);
    const { container } = renderIntoDocument(
      <NotificationBadge count={3} onClick={onClick} />,
    );

    const badge = container.querySelector("button");
    await act(async () => {
      badge?.click();
    });

    expect(onClick).toHaveBeenCalled();
  });

  it("should call onDismiss when dismiss button is clicked", async () => {
    const onDismiss = vi.fn().mockResolvedValue(undefined);
    const { container } = renderIntoDocument(
      <NotificationBadge count={5} onDismiss={onDismiss} />,
    );

    const buttons = container.querySelectorAll("button");
    const dismissButton = Array.from(buttons).find((btn) =>
      btn.getAttribute("aria-label")?.includes("Dismiss"),
    );

    await act(async () => {
      dismissButton?.click();
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it("should hide badge after dismiss", async () => {
    const onDismiss = vi.fn().mockResolvedValue(undefined);
    const { container } = renderIntoDocument(
      <NotificationBadge count={5} onDismiss={onDismiss} />,
    );

    const buttons = container.querySelectorAll("button");
    const dismissButton = Array.from(buttons).find((btn) =>
      btn.getAttribute("aria-label")?.includes("Dismiss"),
    );

    await act(async () => {
      dismissButton?.click();
    });

    // Wait for state update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const badge = container.querySelector('[role="status"]');
    expect(badge).toBeNull();
  });

  it("should not show dismiss button when showDismiss is false", () => {
    const { container } = renderIntoDocument(
      <NotificationBadge count={5} showDismiss={false} />,
    );

    const dismissButton = container.querySelector(
      '[aria-label="Dismiss notifications"]',
    );
    expect(dismissButton).toBeNull();
  });

  it("should have proper aria labels", () => {
    const { container } = renderIntoDocument(
      <NotificationBadge count={3} label="Messages" />,
    );

    const badge = container.querySelector('[role="status"]');
    expect(badge).toBeTruthy();
    expect(badge?.getAttribute("aria-label")).toContain("3 Messages");
  });
});
