// Template file - copy to your project and update imports
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { FeatureName } from "@/pages/FeatureName";

// Mock API server
const server = setupServer(
  rest.get("/api/resource", (_req, res, ctx) => {
    return res(ctx.json({ data: "mock data" }));
  }),
  rest.post("/api/resource", (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: "123" }));
  }),
);

describe("FeatureName Integration", () => {
  // Setup/teardown
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  beforeEach(() => {
    // Reset mocks and clear storage
    vi.clearAllMocks();
    // eslint-disable-next-line no-undef
    localStorage.clear();
  });

  afterEach(() => {
    // Reset handlers to default
    server.resetHandlers();
  });

  describe("happy path", () => {
    it("loads and displays data from API", async () => {
      render(<FeatureName />);

      // Loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/mock data/i)).toBeInTheDocument();
      });
    });

    it("completes user workflow end-to-end", async () => {
      const user = userEvent.setup();
      render(<FeatureName />);

      // Step 1: Initial interaction
      await user.click(screen.getByRole("button", { name: /start/i }));

      // Step 2: Fill form
      await user.type(screen.getByLabelText(/name/i), "Test User");

      // Step 3: Submit
      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Verify result
      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("handles API errors gracefully", async () => {
      // Override default handler with error response
      server.use(
        rest.get("/api/resource", (_req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: "Server error" }));
        }),
      );

      render(<FeatureName />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it("handles validation errors", async () => {
      const user = userEvent.setup();
      render(<FeatureName />);

      // Submit without required fields
      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Verify validation message
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  describe("state management", () => {
    it("syncs state across components", async () => {
      const user = userEvent.setup();
      render(<FeatureName />);

      // Action in component A
      await user.click(screen.getByTestId("action-a"));

      // Verify component B reflects change
      expect(screen.getByTestId("component-b")).toHaveTextContent("updated");
    });

    it("persists state to localStorage", async () => {
      const user = userEvent.setup();
      render(<FeatureName />);

      await user.type(screen.getByLabelText(/name/i), "Test");

      // Verify localStorage updated
      await waitFor(() => {
        // eslint-disable-next-line no-undef
        expect(localStorage.getItem("key")).toBe("Test");
      });
    });
  });
});
