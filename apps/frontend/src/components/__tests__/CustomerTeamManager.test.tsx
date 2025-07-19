import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerTeamManager } from "../CustomerTeamManager";

const mockProps = {
  entityId: "entity-123",
  entityName: "Test Entity",
};

describe("CustomerTeamManager", () => {
  it("renders customer and team management interface", () => {
    render(<CustomerTeamManager {...mockProps} />);

    expect(
      screen.getByText("Customers & Teams for Test Entity"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Manage customers and teams within this entity/),
    ).toBeInTheDocument();
  });

  it("shows customers tab by default", () => {
    render(<CustomerTeamManager {...mockProps} />);

    expect(screen.getByText("Customers (0)")).toBeInTheDocument();
    expect(screen.getByText("Teams (0)")).toBeInTheDocument();
    expect(screen.getByText("Add Customer")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Manage customers within this entity and assign them to teams/,
      ),
    ).toBeInTheDocument();
  });

  it("switches to teams tab when clicked", () => {
    render(<CustomerTeamManager {...mockProps} />);

    fireEvent.click(screen.getByText("Teams (0)"));

    expect(screen.getByText("Add Team")).toBeInTheDocument();
    expect(
      screen.getByText(/Create and manage teams to organize customers/),
    ).toBeInTheDocument();
  });

  it("shows placeholder content when no customers exist", () => {
    render(<CustomerTeamManager {...mockProps} />);

    expect(
      screen.getByText("No customers found for this entity."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Add your first customer to get started/),
    ).toBeInTheDocument();
  });

  it("shows placeholder content when no teams exist", () => {
    render(<CustomerTeamManager {...mockProps} />);

    // Switch to teams tab
    fireEvent.click(screen.getByText("Teams (0)"));

    expect(
      screen.getByText("No teams found for this entity."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create your first team to organize customers/),
    ).toBeInTheDocument();
  });

  it("shows add customer form when button is clicked", async () => {
    render(<CustomerTeamManager {...mockProps} />);

    fireEvent.click(screen.getByText("Add Customer"));

    await waitFor(() => {
      expect(screen.getByText("Add New Customer")).toBeInTheDocument();
      expect(screen.getByLabelText("Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email *")).toBeInTheDocument();
      expect(screen.getByLabelText("Team (Optional)")).toBeInTheDocument();
    });
  });

  it("shows add team form when button is clicked", async () => {
    render(<CustomerTeamManager {...mockProps} />);

    // Switch to teams tab
    fireEvent.click(screen.getByText("Teams (0)"));
    fireEvent.click(screen.getByText("Add Team"));

    await waitFor(() => {
      expect(screen.getByText("Add New Team")).toBeInTheDocument();
      expect(screen.getByLabelText("Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
    });
  });

  it("handles customer form submission", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(<CustomerTeamManager {...mockProps} />);

    // Open customer form
    fireEvent.click(screen.getByText("Add Customer"));

    await waitFor(() => {
      expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Name *"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email *"), {
      target: { value: "john@example.com" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Add Customer" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Adding customer:",
        expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
          entityId: "entity-123",
        }),
      );
    });

    consoleSpy.mockRestore();
  });

  it("handles team form submission", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(<CustomerTeamManager {...mockProps} />);

    // Switch to teams tab and open form
    fireEvent.click(screen.getByText("Teams (0)"));
    fireEvent.click(screen.getByText("Add Team"));

    await waitFor(() => {
      expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Name *"), {
      target: { value: "Development Team" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Main development team" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Add Team" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Adding team:",
        expect.objectContaining({
          name: "Development Team",
          description: "Main development team",
          entityId: "entity-123",
        }),
      );
    });

    consoleSpy.mockRestore();
  });

  // TODO: Add more comprehensive tests
  // - Test form validation
  // - Test cancel functionality
  // - Test editing customers and teams
  // - Test removing customers and teams
  // - Test team assignment for customers
  // - Test API integration
  // - Test error handling
});
