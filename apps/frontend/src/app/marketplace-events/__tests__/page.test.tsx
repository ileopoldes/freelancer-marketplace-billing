import { render, screen, waitFor } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import MarketplaceEventsPage from "../page";

// Mock the API modules
vi.mock("@/lib/api/marketplace-events", () => ({
  marketplaceEventsApi: {
    getAll: vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          name: "Test Event",
          description: "Test Description",
          eventType: "PURCHASE",
          source: "Test Source",
          timestamp: new Date().toISOString(),
          entityId: "test-entity",
          entityName: "Test Entity",
          amount: 100,
          currency: "USD",
          status: "COMPLETED",
          metadata: {},
          userId: "test-user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
    }),
  },
}));

vi.mock("@/lib/api/entities", () => ({
  entitiesApi: {
    getById: vi.fn().mockResolvedValue({
      id: "test-entity",
      name: "Test Entity",
    }),
  },
}));

describe("MarketplaceEventsPage", () => {
  test("renders without crashing", async () => {
    render(<MarketplaceEventsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Marketplace Events")).toBeInTheDocument();
    });
  });

  test("displays event filters", async () => {
    render(<MarketplaceEventsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Filter by Event Type")).toBeInTheDocument();
      expect(screen.getByLabelText("Filter by Status")).toBeInTheDocument();
    });
  });

  test("shows events in table format", async () => {
    render(<MarketplaceEventsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Event")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
    });
  });
});
