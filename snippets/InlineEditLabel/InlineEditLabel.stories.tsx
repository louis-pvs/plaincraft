import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within, userEvent } from "storybook/test";
import {
  InlineEditLabel,
  InlineEditLabelHeadless,
  type InlineEditLabelProps,
} from "./InlineEditLabel";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TYPE_SPEED = { delay: 40 };

const meta: Meta<typeof InlineEditLabel> = {
  title: "Snippets/InlineEditLabel",
  component: InlineEditLabel,
  args: {
    value: "Team charter",
    maxLength: 32,
    onSave: async () => {
      await delay(150);
    },
  } satisfies Partial<InlineEditLabelProps>,
  render: (args) => {
    const [value, setValue] = useState(args.value);

    useEffect(() => {
      setValue(args.value);
    }, [args.value]);

    const handleSave = async (nextValue: string) => {
      await args.onSave(nextValue);
      setValue(nextValue);
    };

    return <InlineEditLabel {...args} value={value} onSave={handleSave} />;
  },
  parameters: {
    a11y: { disable: false },
  },
};
export default meta;

type Story = StoryObj<typeof InlineEditLabel>;

export const Basic: Story = {};

export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /edit label/i }));
    const input = await canvas.findByRole("textbox", { name: /edit label/i });
    await userEvent.clear(input);
    await userEvent.type(input, "Product strategy", TYPE_SPEED);
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Saved");
    await expect(
      canvas.getByRole("button", { name: /edit label/i }),
    ).toHaveTextContent("Product strategy");
  },
};

export const CancelsWithEscape: Story = {
  args: {
    maxLength: 32,
    value: "Original value",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /edit label/i }));
    const input = await canvas.findByRole("textbox", { name: /edit label/i });
    await userEvent.clear(input);
    await userEvent.type(input, "Changed value", TYPE_SPEED);
    await userEvent.keyboard("{Escape}");
    // Should show "Changes discarded" message
    await canvas.findByText("Changes discarded.");
    // And the button should still show original value
    const button = await canvas.findByRole("button", {
      name: /edit label/i,
    });
    await expect(button).toHaveTextContent("Original value");
  },
};

export const RetryOnError: Story = {
  args: {
    value: "Launch plan",
    maxLength: 16,
    errorLabel: "Save failed. Retry to continue.",
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    const [shouldFail, setShouldFail] = useState(true);

    useEffect(() => {
      setValue(args.value);
    }, [args.value]);

    const handleSave = async (nextValue: string) => {
      await delay(120);
      if (shouldFail) {
        setShouldFail(false);
        throw new Error("Simulated failure");
      }
      setValue(nextValue);
    };

    return <InlineEditLabel {...args} value={value} onSave={handleSave} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const launchButton = await canvas.findByRole("button", {
      name: /edit label/i,
    });
    await userEvent.click(launchButton);
    const input = await canvas.findByRole("textbox", {
      name: /edit label/i,
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Launch update", TYPE_SPEED);
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Save failed. Retry to continue.");
    await userEvent.clear(input);
    await userEvent.type(input, "Launch retry", TYPE_SPEED);
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Saved");
    const button = await canvas.findByRole("button", {
      name: /edit label/i,
    });
    await expect(button).toHaveTextContent(/Launch retry/);
  },
};

export const HeadlessCustomView: Story = {
  args: {
    value: "Custom styled",
    maxLength: 32,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);

    useEffect(() => {
      setValue(args.value);
    }, [args.value]);

    const handleSave = async (nextValue: string) => {
      await delay(150);
      setValue(nextValue);
    };

    return (
      <InlineEditLabelHeadless
        value={value}
        maxLength={args.maxLength}
        onSave={handleSave}
        labels={{
          saving: "⏳ Saving...",
          success: "✅ Done!",
          error: "❌ Error",
          discarded: "🚫 Cancelled",
        }}
      >
        {(controller) => (
          <div className="space-y-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
            <div className="text-sm font-semibold text-indigo-900">
              Custom Headless Implementation
            </div>
            {!controller.isEditing && (
              <button
                onClick={controller.beginEditing}
                onKeyDown={controller.handleDisplayKeyDown}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-left text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="font-medium">{controller.displayValue}</span>
                <span className="ml-2 text-xs text-indigo-200">
                  Click to edit
                </span>
              </button>
            )}
            {controller.isEditing && (
              <div className="space-y-2">
                <input
                  ref={controller.inputRef}
                  value={controller.draft}
                  onChange={(e) => controller.updateDraft(e.target.value)}
                  onBlur={controller.handleBlur}
                  onKeyDown={controller.handleInputKeyDown}
                  disabled={controller.status === "saving"}
                  className="w-full rounded-lg border-2 border-indigo-300 bg-white px-4 py-3 text-indigo-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  placeholder="Enter new value..."
                />
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => controller.saveDraft()}
                    disabled={controller.status === "saving"}
                    className="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={controller.cancelEditing}
                    disabled={controller.status === "saving"}
                    className="rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {controller.message && (
              <div
                className={`text-sm font-medium ${
                  controller.messageTone === "error"
                    ? "text-red-600"
                    : controller.messageTone === "success"
                      ? "text-green-600"
                      : "text-indigo-600"
                }`}
              >
                {controller.message}
              </div>
            )}
          </div>
        )}
      </InlineEditLabelHeadless>
    );
  },
};
