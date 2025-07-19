import { render, screen } from "@testing-library/react";
import EntitiesPage from "../page";

// Mock the API modules
jest.mock("@/lib/api/entities", () => ({
  Entity: {},
  CreateEntityRequest: {},
}));

jest.mock("@/lib/api/organizations", () => ({
  Organization: {},
  organizationsApi: {
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

// Mock the components
jest.mock("@/components/EntityForm", () => ({
  EntityForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="entity-form">
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("@/components/EntityList", () => ({
  EntityList: () => <div data-testid="entity-list">Entity List</div>,
}));

describe("EntitiesPage", () => {
  it("renders entities page with placeholder content", async () => {
    render(<EntitiesPage />);

    // Wait for loading to complete
    await screen.findByText("Entities");

    expect(screen.getByText("Entities")).toBeInTheDocument();
    expect(
      screen.getByText(/Manage entities and their billing configurations/),
    ).toBeInTheDocument();
    expect(screen.getByText("Add Entity")).toBeInTheDocument();
    expect(screen.getByText("Filter by Organization")).toBeInTheDocument();
  });

  it("shows placeholder when no entities exist", async () => {
    render(<EntitiesPage />);

    // Wait for loading to complete
    await screen.findByText("No entities found");

    expect(screen.getByText("No entities found")).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by creating your first entity/),
    ).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests
  // - Test entity creation flow
  // - Test organization filtering
  // - Test entity editing
  // - Test API integration
  // - Test error handling
});
