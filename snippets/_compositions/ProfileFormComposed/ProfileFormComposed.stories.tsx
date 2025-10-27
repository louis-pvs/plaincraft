import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within, userEvent } from "storybook/test";
import {
  ProfileFormComposed,
  type ProfileFormComposedProps,
  type ProfileData,
} from "./ProfileFormComposed";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TYPE_SPEED = { delay: 30 };

const meta: Meta<typeof ProfileFormComposed> = {
  title: "Compositions/ProfileFormComposed",
  component: ProfileFormComposed,
  args: {
    initialData: {
      name: "Alex Smith",
      email: "alex.smith@example.com",
      bio: "Product designer passionate about accessible interfaces.",
    },
    onSave: async () => {
      await delay(800);
    },
    maxNameLength: 50,
    maxEmailLength: 100,
    maxBioLength: 500,
  } satisfies Partial<ProfileFormComposedProps>,
  render: (args) => {
    const [savedData, setSavedData] = useState(args.initialData);

    const handleSave = async (data: ProfileData) => {
      await args.onSave(data);
      setSavedData(data);
    };

    return (
      <ProfileFormComposed
        {...args}
        initialData={savedData}
        onSave={handleSave}
      />
    );
  },
  parameters: {
    a11y: { disable: false },
    layout: "centered",
  },
  tags: ["record"],
};
export default meta;

type Story = StoryObj<typeof ProfileFormComposed>;

export const Basic: Story = {};

export const EditAndSave: Story = {
  tags: ["record"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Update name field
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Jordan Lee", TYPE_SPEED);

    // Wait a bit for visual effect
    await delay(300);

    // Update email field
    const emailInput = canvas.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "jordan.lee@example.com", TYPE_SPEED);

    // Wait a bit
    await delay(300);

    // Update bio field
    const bioInput = canvas.getByLabelText(/bio/i);
    await userEvent.clear(bioInput);
    await userEvent.type(
      bioInput,
      "Senior engineer focused on building scalable systems.",
      TYPE_SPEED,
    );

    // Wait a bit before saving
    await delay(400);

    // Click save button
    const saveButton = canvas.getByRole("button", { name: /save profile/i });
    await userEvent.click(saveButton);

    // Wait for success message
    await canvas.findByText(
      /profile saved successfully/i,
      {},
      { timeout: 2000 },
    );

    // Verify the form shows updated values
    await expect(nameInput).toHaveValue("Jordan Lee");
    await expect(emailInput).toHaveValue("jordan.lee@example.com");
  },
};

export const ValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Clear name field (required)
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.tab();

    // Clear email field (required)
    const emailInput = canvas.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.tab();

    // Try to save with invalid data
    const saveButton = canvas.getByRole("button", { name: /save profile/i });
    await userEvent.click(saveButton);

    // Should show validation errors
    await canvas.findByText(/name is required/i);
    await canvas.findByText(/email is required/i);

    // Save button should be disabled
    await expect(saveButton).toBeDisabled();
  },
};

export const ResetForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const originalName = "Alex Smith";

    // Update name field
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Changed Name", TYPE_SPEED);

    // Wait a bit
    await delay(200);

    // Click reset button
    const resetButton = canvas.getByRole("button", { name: /reset/i });
    await userEvent.click(resetButton);

    // Should show reset message
    await canvas.findByText(/changes discarded/i);

    // Name should be back to original
    await expect(nameInput).toHaveValue(originalName);

    // Reset button should be disabled again
    await expect(resetButton).toBeDisabled();
  },
};

export const KeyboardShortcuts: Story = {
  tags: ["record"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Update name field
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Keyboard User", TYPE_SPEED);

    // Wait
    await delay(300);

    // Use Cmd+Enter to save (or Ctrl+Enter)
    await userEvent.keyboard("{Meta>}{Enter}{/Meta}");

    // Wait for success message
    await canvas.findByText(
      /profile saved successfully/i,
      {},
      { timeout: 2000 },
    );

    // Verify the form shows updated value
    await expect(nameInput).toHaveValue("Keyboard User");
  },
};

export const CharacterCounters: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Type in name field and check counter
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Test", TYPE_SPEED);

    // Should show character count
    await canvas.findByText(/4\/50/);

    // Type in bio field
    const bioInput = canvas.getByLabelText(/bio/i);
    await userEvent.clear(bioInput);
    await userEvent.type(bioInput, "This is a short bio.", TYPE_SPEED);

    // Should show bio character count
    await canvas.findByText(/21\/500/);
  },
};

export const EmailValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Type invalid email
    const emailInput = canvas.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "not-an-email", TYPE_SPEED);
    await userEvent.tab();

    // Should show validation error
    await canvas.findByText(/invalid email format/i);

    // Save button should be disabled
    const saveButton = canvas.getByRole("button", { name: /save profile/i });
    await expect(saveButton).toBeDisabled();

    // Fix the email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "valid@example.com", TYPE_SPEED);
    await userEvent.tab();

    // Error should disappear
    const errorElements = canvas.queryAllByText(/invalid email format/i);
    await expect(errorElements.length).toBe(0);
  },
};

export const LongBio: Story = {
  args: {
    initialData: {
      name: "Taylor Morgan",
      email: "taylor@example.com",
      bio: "Experienced software architect with over 15 years in the industry. Specialized in distributed systems, microservices architecture, and cloud-native applications. Passionate about mentoring junior developers and building high-performing engineering teams. Strong advocate for clean code, test-driven development, and continuous integration practices.",
    },
  },
};

export const EmptyInitialState: Story = {
  args: {
    initialData: {
      name: "",
      email: "",
      bio: "",
    },
  },
};
