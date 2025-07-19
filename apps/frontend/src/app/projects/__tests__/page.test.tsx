import { render, screen } from "@testing-library/react";
import { fireEvent, waitFor } from "@testing-library/react";
import ProjectsPage from "../page";

describe("ProjectsPage", () => {
  it("renders projects page with placeholder content", async () => {
    render(<ProjectsPage />);

    // Wait for loading to complete
    await screen.findByText("Projects");

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(
      screen.getByText(/Manage projects and their assignments/),
    ).toBeInTheDocument();
    expect(screen.getByText("Add Project")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search projects..."),
    ).toBeInTheDocument();
  });

  it("shows placeholder when no projects exist", async () => {
    render(<ProjectsPage />);

    // Wait for loading to complete
    await screen.findByText("No projects found");

    expect(screen.getByText("No projects found")).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by creating your first project/),
    ).toBeInTheDocument();
    expect(screen.getByText("Create Project")).toBeInTheDocument();
  });

  it("handles search functionality", async () => {
    render(<ProjectsPage />);

    // Wait for loading to complete
    await screen.findByPlaceholderText("Search projects...");

    const searchInput = screen.getByPlaceholderText("Search projects...");

    fireEvent.change(searchInput, { target: { value: "test search" } });

    await waitFor(() => {
      expect(
        screen.getByText("No projects match your search"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /We couldn't find any projects matching "test search"/,
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows clear search button when searching", async () => {
    render(<ProjectsPage />);

    // Wait for loading to complete
    await screen.findByPlaceholderText("Search projects...");

    const searchInput = screen.getByPlaceholderText("Search projects...");

    fireEvent.change(searchInput, { target: { value: "test" } });

    await waitFor(() => {
      expect(screen.getByText("Clear Search")).toBeInTheDocument();
    });
  });

  // TODO: Add more comprehensive tests
  // - Test project creation flow
  // - Test project search filtering
  // - Test project list rendering with actual data
  // - Test API integration
  // - Test error handling
});
