import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Credits } from "../Credits";

describe("Credits", () => {
  it("renders credits management interface", () => {
    render(<Credits />);

    expect(screen.getByText("Credits Management")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Manage credit balances for organizations, entities, and customers/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Add Credits")).toBeInTheDocument();
  });

  it("shows filters for entity type and search", () => {
    render(<Credits />);

    expect(screen.getByLabelText("Filter by Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Search")).toBeInTheDocument();

    // Check filter options
    const filterSelect = screen.getByLabelText("Filter by Type");
    expect(filterSelect).toHaveValue("all");
    fireEvent.click(filterSelect);
    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("Entities")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  it("shows placeholder when no credit balances exist", () => {
    render(<Credits />);

    expect(screen.getByText("No credit balances found")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Get started by adding credits to organizations, entities, or customers/,
      ),
    ).toBeInTheDocument();
  });

  it("shows add credits form when button is clicked", async () => {
    render(<Credits />);

    fireEvent.click(screen.getAllByText("Add Credits")[0]);

    await waitFor(() => {
      expect(screen.getByText("Add Credits")).toBeInTheDocument();
      expect(screen.getByLabelText("Entity Type *")).toBeInTheDocument();
      expect(screen.getByLabelText("Credit Amount *")).toBeInTheDocument();
    });
  });

  it("handles form submission for adding credits", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(<Credits />);

    // Open the form
    fireEvent.click(screen.getAllByText("Add Credits")[0]);

    await waitFor(() => {
      expect(screen.getByLabelText("Credit Amount *")).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Credit Amount *"), {
      target: { value: "100.50" },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: "Test credit addition" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /Add Credits/ }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Adding credits:",
        expect.objectContaining({
          entityType: "organization",
          amount: 100.5,
          description: "Test credit addition",
        }),
      );
    });

    consoleSpy.mockRestore();
  });

  // TODO: Add more comprehensive tests
  // - Test filtering functionality
  // - Test search functionality
  // - Test credit balance display with actual data
  // - Test API integration
  // - Test error handling
  // - Test different entity type selections
});
