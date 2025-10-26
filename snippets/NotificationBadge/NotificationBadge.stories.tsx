import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { getUser } from "../_utils/getUser";
import {
  NotificationBadge,
  type NotificationBadgeProps,
} from "./NotificationBadge";

const meta: Meta<typeof NotificationBadge> = {
  title: "Snippets/NotificationBadge",
  component: NotificationBadge,
  args: {
    count: 5,
    label: "Notifications",
    variant: "default",
    maxCount: 99,
    showDismiss: true,
  } satisfies Partial<NotificationBadgeProps>,
  parameters: {
    a11y: { disable: false },
  },
};
export default meta;

type Story = StoryObj<typeof NotificationBadge>;

export const Basic: Story = {
  args: {
    count: 3,
    label: "Messages",
  },
};

export const Interaction: Story = {
  args: {
    count: 7,
    label: "Alerts",
    variant: "primary",
    onClick: () => {
      console.log("Badge clicked");
      return Promise.resolve();
    },
    onDismiss: () => {
      console.log("Dismissed");
      return Promise.resolve();
    },
  },
  tags: ["record"],
  play: async ({ canvasElement }) => {
    const user = getUser(600);
    const canvas = within(canvasElement);

    const badge = await canvas.findByLabelText("7 Alerts");
    await expect(badge).toBeInTheDocument();
    await expect(badge).toHaveAttribute("role", "status");

    await user.click(badge);

    const dismissButton = await canvas.findByLabelText("Dismiss notifications");
    await expect(dismissButton).toBeInTheDocument();
    await user.click(dismissButton);

    await expect(badge).not.toBeInTheDocument();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <NotificationBadge count={3} label="Default" variant="default" />
      <NotificationBadge count={5} label="Primary" variant="primary" />
      <NotificationBadge count={8} label="Warning" variant="warning" />
      <NotificationBadge count={12} label="Danger" variant="danger" />
    </div>
  ),
};

export const ExceedsMaxCount: Story = {
  args: {
    count: 125,
    maxCount: 99,
    label: "Notifications",
    variant: "danger",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = await canvas.findByLabelText("125 Notifications");
    await expect(badge).toBeInTheDocument();
  },
};

export const ZeroCount: Story = {
  args: {
    count: 0,
    label: "Messages",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.queryByRole("button");
    await expect(badge).not.toBeInTheDocument();
  },
};

export const NoDismiss: Story = {
  args: {
    count: 5,
    label: "Notifications",
    showDismiss: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dismissButton = canvas.queryByLabelText("Dismiss notifications");
    await expect(dismissButton).not.toBeInTheDocument();
  },
};
