import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { TemplateSnippet, type TemplateSnippetProps } from "./TemplateSnippet";
import { TemplateSnippetHeadless } from "./TemplateSnippetHeadless";

const meta: Meta<typeof TemplateSnippet> = {
  title: "Snippets/TemplateSnippet",
  component: TemplateSnippet,
  args: {
    label: "Example",
    maxLength: 20,
  } satisfies Partial<TemplateSnippetProps>,
  parameters: {
    a11y: { disable: false },
  },
};
export default meta;

type Story = StoryObj<typeof TemplateSnippet>;

export const Basic: Story = {};

export const Interaction: Story = {
  args: {
    label: "Try it",
    maxLength: 50,
    onAction: () => Promise.resolve(),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findByPlaceholderText("Type something...");
    await userEvent.type(input, "hello");
    const button = await c.findByRole("button", { name: /do action/i });
    await userEvent.click(button);
    await expect(
      await c.findByText("Action completed successfully"),
    ).toBeInTheDocument();
  },
};

export const RespectsMaxLength: Story = {
  args: { maxLength: 5 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findByPlaceholderText("Type something...");
    await userEvent.type(input, "hello world");
    await expect(input).toHaveValue("hello");
  },
};

export const ErrorHandling: Story = {
  args: {
    label: "Will fail",
    onAction: () => Promise.reject(new Error("Test error")),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findByPlaceholderText("Type something...");
    await userEvent.type(input, "test");
    const button = await c.findByRole("button");
    await userEvent.click(button);
    await expect(await c.findByText("Test error")).toBeInTheDocument();
  },
};

export const HeadlessCustomView: Story = {
  render: (args) => (
    <TemplateSnippetHeadless {...args}>
      {(state) => (
        <div className="space-y-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
          <label
            htmlFor={state.inputId}
            className="block text-sm font-bold text-indigo-900"
          >
            Custom Styled Input
          </label>
          <input
            {...state.inputProps}
            ref={state.inputRef}
            onChange={(e) => state.updateValue(e.target.value)}
            className="w-full rounded border-2 border-indigo-300 bg-white px-3 py-2 text-indigo-900 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            placeholder="Custom placeholder"
          />
          <div className="text-xs text-indigo-700">
            {state.value.length} / {state.inputProps.maxLength}
          </div>
          {state.message && (
            <div
              className={`text-sm font-medium ${
                state.messageTone === "error"
                  ? "text-red-700"
                  : state.messageTone === "success"
                    ? "text-green-700"
                    : "text-indigo-700"
              }`}
            >
              {state.message}
            </div>
          )}
          <button
            {...state.buttonProps}
            ref={state.buttonRef}
            onClick={state.handleAction}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {state.status === "loading" ? "Processing..." : "Submit"}
          </button>
        </div>
      )}
    </TemplateSnippetHeadless>
  ),
  args: {
    maxLength: 50,
    onAction: () => new Promise((resolve) => setTimeout(resolve, 1000)),
  },
};
