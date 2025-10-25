import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within, userEvent } from "storybook/test";
import { InlineEditLabel, type InlineEditLabelProps } from "./InlineEditLabel";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    await userEvent.type(input, "Product strategy");
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Saved");
    await expect(
      canvas.getByRole("button", { name: /edit label/i }),
    ).toHaveTextContent("Product strategy");
  },
};

export const RejectsOverLimit: Story = {
  args: {
    maxLength: 8,
    value: "Launch sprint plan",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /edit label/i }));
    await canvas.findByRole("textbox", { name: /edit label/i });
    await userEvent.keyboard("{Enter}");
    await canvas.findByText(/keep it under 8 characters/i);
  },
};

export const RetryOnError: Story = {
  args: {
    value: "Launch plan",
    maxLength: 16,
    errorLabel: "Save failed. Retry to continue.",
    ariaLabel: "Edit launch plan label",
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
      name: /edit launch plan label/i,
    });
    await userEvent.click(launchButton);
    const input = await canvas.findByRole("textbox", {
      name: /edit launch plan/i,
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Launch update");
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Save failed. Retry to continue.");
    await userEvent.keyboard("{Enter}");
    const button = await canvas.findByRole("button", {
      name: /edit launch plan/i,
    });
    await expect(button).toHaveTextContent("Launch update");
  },
};
