import React, { useState } from "react";
import { useProfileFormController } from "./useProfileFormController";
import type {
  ProfileFormControllerProps,
  ProfileData,
} from "./useProfileFormController";
import { ProfileFormView } from "./ProfileFormView";

// Re-export types and components for convenience
export { useProfileFormController } from "./useProfileFormController";
export { ProfileFormView } from "./ProfileFormView";
export type {
  ProfileFormControllerProps,
  ProfileFormControllerState,
  ProfileData,
  SaveStatus,
} from "./useProfileFormController";

export type ProfileFormComposedProps = ProfileFormControllerProps & {
  maxNameLength?: number;
  maxEmailLength?: number;
  maxBioLength?: number;
};

/**
 * ProfileFormComposed
 * A composition demonstrating multi-field form with validation.
 *
 * Architecture: Headless controller hook + pluggable view.
 * Seams: data and callbacks passed via props. No fetching.
 * Invariants: validates email format, required fields, length limits.
 * A11y: keyboard shortcuts, ARIA labels, error announcements.
 */
export function ProfileFormComposed({
  initialData,
  onSave,
  maxNameLength = 50,
  maxEmailLength = 100,
  maxBioLength = 500,
  labels,
}: ProfileFormComposedProps) {
  const controller = useProfileFormController({
    initialData,
    onSave,
    maxNameLength,
    maxEmailLength,
    maxBioLength,
    labels,
  });

  return (
    <ProfileFormView
      controller={controller}
      maxNameLength={maxNameLength}
      maxEmailLength={maxEmailLength}
      maxBioLength={maxBioLength}
    />
  );
}

/**
 * Demo
 * Tiny harness used by the demo app. Keeps one source of truth.
 */
export function Demo() {
  const [savedData, setSavedData] = useState<ProfileData>({
    name: "Alex Smith",
    email: "alex.smith@example.com",
    bio: "Product designer passionate about building accessible, user-friendly interfaces.",
  });

  const handleSave = async (data: ProfileData) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSavedData(data);
    console.log("Saved profile:", data);
  };

  return (
    <div className="space-y-4">
      <ProfileFormComposed initialData={savedData} onSave={handleSave} />
      <div className="rounded-md border border-slate-300 bg-slate-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-slate-700">
          Last Saved Data
        </h3>
        <pre className="text-xs text-slate-600">
          {JSON.stringify(savedData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
