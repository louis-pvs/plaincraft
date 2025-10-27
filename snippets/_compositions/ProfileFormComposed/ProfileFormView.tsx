import React from "react";
import type { ProfileFormControllerState } from "./useProfileFormController";

export type ProfileFormViewProps = {
  controller: ProfileFormControllerState;
  maxNameLength?: number;
  maxEmailLength?: number;
  maxBioLength?: number;
};

export function ProfileFormView({
  controller,
  maxNameLength = 50,
  maxEmailLength = 100,
  maxBioLength = 500,
}: ProfileFormViewProps) {
  const {
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
  } = controller;

  const messageClass =
    messageTone === "error"
      ? "text-rose-600"
      : messageTone === "success"
        ? "text-emerald-600"
        : "text-slate-700";

  const isDisabled = status === "saving";

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">
          Edit Profile
        </h2>

        <form
          id={formId}
          onKeyDown={handleKeyDown}
          onSubmit={(e) => {
            e.preventDefault();
            void saveForm();
          }}
          className="space-y-4"
        >
          {/* Name Field */}
          <div>
            <label
              htmlFor={`${formId}-name`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Name <span className="text-rose-600">*</span>
            </label>
            <input
              ref={nameInputRef}
              id={`${formId}-name`}
              type="text"
              value={data.name}
              onChange={(e) => updateField("name", e.target.value)}
              maxLength={maxNameLength}
              disabled={isDisabled}
              aria-invalid={!!errors.name}
              aria-describedby={
                errors.name ? `${formId}-name-error` : undefined
              }
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-wait disabled:bg-slate-100 ${
                errors.name
                  ? "border-rose-500 focus:border-rose-500"
                  : "border-slate-300"
              }`}
              placeholder="Enter your name"
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.name && (
                <span
                  id={`${formId}-name-error`}
                  className="text-xs text-rose-600"
                  role="alert"
                >
                  {errors.name}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">
                {data.name.length}/{maxNameLength}
              </span>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor={`${formId}-email`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email <span className="text-rose-600">*</span>
            </label>
            <input
              ref={emailInputRef}
              id={`${formId}-email`}
              type="email"
              value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
              maxLength={maxEmailLength}
              disabled={isDisabled}
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? `${formId}-email-error` : undefined
              }
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-wait disabled:bg-slate-100 ${
                errors.email
                  ? "border-rose-500 focus:border-rose-500"
                  : "border-slate-300"
              }`}
              placeholder="your.email@example.com"
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.email && (
                <span
                  id={`${formId}-email-error`}
                  className="text-xs text-rose-600"
                  role="alert"
                >
                  {errors.email}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">
                {data.email.length}/{maxEmailLength}
              </span>
            </div>
          </div>

          {/* Bio Field */}
          <div>
            <label
              htmlFor={`${formId}-bio`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Bio
            </label>
            <textarea
              ref={bioInputRef}
              id={`${formId}-bio`}
              value={data.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              maxLength={maxBioLength}
              disabled={isDisabled}
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? `${formId}-bio-error` : undefined}
              rows={4}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-wait disabled:bg-slate-100 ${
                errors.bio
                  ? "border-rose-500 focus:border-rose-500"
                  : "border-slate-300"
              }`}
              placeholder="Tell us about yourself..."
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.bio && (
                <span
                  id={`${formId}-bio-error`}
                  className="text-xs text-rose-600"
                  role="alert"
                >
                  {errors.bio}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">
                {data.bio.length}/{maxBioLength}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={!isDirty || isDisabled}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!isDirty || !isValid || isDisabled}
              className="relative flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "saving" && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${messageClass} ${
            messageTone === "error"
              ? "border-rose-200 bg-rose-50"
              : messageTone === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50"
          }`}
          role={messageTone === "error" ? "alert" : "status"}
          aria-live={messageTone === "error" ? "assertive" : "polite"}
        >
          {message}
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-slate-500">
        <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5">
          Cmd/Ctrl + Enter
        </kbd>{" "}
        to save •{" "}
        <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5">
          Esc
        </kbd>{" "}
        to reset
      </div>
    </div>
  );
}
