import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { TemplateSnippet, type TemplateSnippetProps } from "./TemplateSnippet";

const meta: Meta<typeof TemplateSnippet> = {
  title: "Snippets/TemplateSnippet",
  component: TemplateSnippet,
  args: {
    label: "Example",
    max: 20,
  } satisfies Partial<TemplateSnippetProps>,
  parameters: {
    a11y: { disable: false },
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof TemplateSnippet>;

export const Basic: Story = {};

export const Interaction: Story = {
  args: { label: "Try it", max: 12, onAction: () => Promise.resolve() },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findByPlaceholderText("Type something");
    await userEvent.type(input, "hello");
    const button = await c.findByRole("button", { name: /do action/i });
    await userEvent.click(button);
    await expect(input).toHaveValue("hello");
  },
};

export const RespectsMax: Story = {
  args: { max: 3 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findByPlaceholderText("Type something");
    await userEvent.type(input, "over");
    await expect(input).toHaveValue("ove");
  },
};
