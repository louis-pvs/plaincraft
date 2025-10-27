/* eslint-disable no-undef */
import { useEffect, useId, useRef, useState } from "react";

export type ProfileData = {
  name: string;
  email: string;
  bio: string;
};

export type ProfileFormControllerProps = {
  initialData: ProfileData;
  onSave: (data: ProfileData) => Promise<void> | void;
  maxNameLength?: number;
  maxEmailLength?: number;
  maxBioLength?: number;
  labels?: {
    saving?: string;
    success?: string;
    error?: string;
    discarded?: string;
  };
};

export type SaveStatus = "idle" | "saving" | "success" | "error";

export type ProfileFormControllerState = {
  // Form data
  data: ProfileData;
  isDirty: boolean;
  isValid: boolean;

  // Save lifecycle
  status: SaveStatus;
  message: string;
  messageTone: "error" | "success" | "info";

  // Validation
  errors: {
    name?: string;
    email?: string;
    bio?: string;
  };

  // Refs
  formId: string;
  nameInputRef: React.RefObject<HTMLInputElement>;
  emailInputRef: React.RefObject<HTMLInputElement>;
  bioInputRef: React.RefObject<HTMLTextAreaElement>;

  // Actions
  updateField: (field: keyof ProfileData, value: string) => void;
  saveForm: () => Promise<void>;
  resetForm: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
};

export function useProfileFormController({
  initialData,
  onSave,
  maxNameLength = 50,
  maxEmailLength = 100,
  maxBioLength = 500,
  labels = {},
}: ProfileFormControllerProps): ProfileFormControllerState {
  // Runtime guards
  if (import.meta.env.DEV) {
    if (!initialData) {
      console.warn("ProfileFormComposed: initialData is required");
    }
    if (typeof onSave !== "function") {
      console.warn("ProfileFormComposed: onSave must be a function");
    }
  }

  const savingLabel = labels.saving ?? "Saving profile…";
  const successLabel = labels.success ?? "Profile saved successfully!";
  const errorLabel = labels.error ?? "Failed to save. Please try again.";
  const discardedLabel = labels.discarded ?? "Changes discarded.";

  const [data, setData] = useState<ProfileData>(initialData);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    bio?: string;
  }>({});

  const formId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);
  const cancelNextSave = useRef(false);

  // Check if form is dirty
  const isDirty =
    data.name !== initialData.name ||
    data.email !== initialData.email ||
    data.bio !== initialData.bio;

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!data.name.trim()) {
      newErrors.name = "Name is required";
    } else if (data.name.length > maxNameLength) {
      newErrors.name = `Name must be ${maxNameLength} characters or less`;
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Invalid email format";
    } else if (data.email.length > maxEmailLength) {
      newErrors.email = `Email must be ${maxEmailLength} characters or less`;
    }

    if (data.bio.length > maxBioLength) {
      newErrors.bio = `Bio must be ${maxBioLength} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValid = validateForm();

  // Clear success message after timeout
  useEffect(() => {
    if (status !== "success") {
      return;
    }
    const timer = window.setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const updateField = (field: keyof ProfileData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const saveForm = async () => {
    if (cancelNextSave.current) {
      cancelNextSave.current = false;
      return;
    }

    if (!isValid) {
      setStatus("error");
      setMessage("Please fix the errors before saving");
      return;
    }

    if (!isDirty) {
      setStatus("success");
      setMessage("No changes to save");
      return;
    }

    setStatus("saving");
    setMessage(savingLabel);

    try {
      await onSave(data);
      setStatus("success");
      setMessage(successLabel);
    } catch (error) {
      setStatus("error");
      setMessage(errorLabel);
      console.warn("Save failed:", error);
    }
  };

  const resetForm = () => {
    cancelNextSave.current = true;
    setData(initialData);
    setStatus("idle");
    setMessage(discardedLabel);
    setErrors({});
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resetForm();
    }
    // Cmd/Ctrl + Enter to save
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void saveForm();
    }
  };

  const messageTone: "error" | "success" | "info" =
    status === "error" ? "error" : status === "success" ? "success" : "info";

  return {
    data,
    isDirty,
    isValid,
    status,
    message,
    messageTone,
    errors,
    formId,
    nameInputRef,
    emailInputRef,
    bioInputRef,
    updateField,
    saveForm,
    resetForm,
    handleKeyDown,
  };
}
