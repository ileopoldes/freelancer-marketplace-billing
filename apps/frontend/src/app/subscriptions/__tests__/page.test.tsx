import { render, screen, waitFor } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import SubscriptionsPage from "../page";

// Mock the API modules
vi.mock("@/lib/api/subscriptions", () => ({
  subscriptionsApi: {
    getAll: vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          name: "Test Plan",
          description: "Test Description",
          price: 29.99,
          billingPeriod: "MONTHLY",
          features: ["Feature 1", "Feature 2"],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
    }),
  },
}));

describe("SubscriptionsPage", () => {
  test("renders without crashing", async () => {
    render(<SubscriptionsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    });
  });

  test("displays subscription plans", async () => {
    render(<SubscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Plan")).toBeInTheDocument();
      expect(screen.getByText("$29.99")).toBeInTheDocument();
    });
  });

  test("has billing period filter", async () => {
    render(<SubscriptionsPage />);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Filter by Billing Period"),
      ).toBeInTheDocument();
    });
  });
});
