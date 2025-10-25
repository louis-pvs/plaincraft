import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within, userEvent, waitFor } from "@storybook/test";
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
  tags: ["autodocs"],
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
    await waitFor(async () => {
      await expect(canvas.getByText("Saved")).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: /edit label/i }),
    ).toHaveTextContent("Product strategy");
  },
};

export const RejectsOverLimit: Story = {
  args: {
    maxLength: 8,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /edit label/i }));
    const input = await canvas.findByRole("textbox", { name: /edit label/i });
    await userEvent.clear(input);
    await userEvent.type(input, "Too many characters");
    await userEvent.keyboard("{Enter}");
    await expect(
      canvas.getByText(/keep it under 8 characters/i),
    ).toBeInTheDocument();
  },
};

export const RetryOnError: Story = {
  args: {
    value: "Launch plan",
    maxLength: 16,
    errorLabel: "Save failed. Retry to continue.",
    onSave: (() => {
      let shouldFail = true;
      return async () => {
        await delay(120);
        if (shouldFail) {
          shouldFail = false;
          throw new Error("Simulated failure");
        }
      };
    })(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /edit launch plan/i }),
    );
    const input = await canvas.findByRole("textbox", {
      name: /edit launch plan/i,
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Launch update");
    await userEvent.keyboard("{Enter}");
    await expect(
      canvas.getByText("Save failed. Retry to continue."),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    await waitFor(async () => {
      await expect(canvas.getByText("Saved")).toBeInTheDocument();
    });
  },
};
