import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OrganizationDetailPage from "../page";
import { organizationsApi } from "@/lib/api/organizations";
import { entitiesApi } from "@/lib/api/entities";

// Mock the APIs
jest.mock("@/lib/api/organizations", () => ({
  organizationsApi: {
    getById: jest.fn(),
  },
}));

jest.mock("@/lib/api/entities", () => ({
  entitiesApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockOrganizationsApi = organizationsApi as jest.Mocked<
  typeof organizationsApi
>;
const mockEntitiesApi = entitiesApi as jest.Mocked<typeof entitiesApi>;

describe("Organization Detail Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  const mockProps = {
    params: { id: "1" },
  };

  it("renders organization detail page with loading state", async () => {
    mockOrganizationsApi.getById.mockImplementation(
      () => new Promise(() => {}),
    );
    mockEntitiesApi.getAll.mockImplementation(() => new Promise(() => {}));

    renderWithQueryClient(<OrganizationDetailPage {...mockProps} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders organization detail page with data", async () => {
    const mockOrganization = {
      id: "1",
      name: "Test Organization",
      domain: "test.com",
      billingEmail: "billing@test.com",
      status: "ACTIVE",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const mockEntities = [
      {
        id: "1",
        organizationId: "1",
        name: "Test Entity",
        description: "Test entity description",
        billingModel: "PAY_AS_YOU_GO",
        status: "ACTIVE",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    ];

    mockOrganizationsApi.getById.mockResolvedValue(mockOrganization);
    mockEntitiesApi.getAll.mockResolvedValue(mockEntities);

    renderWithQueryClient(<OrganizationDetailPage {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Test Organization")).toBeInTheDocument();
      expect(screen.getByText("billing@test.com")).toBeInTheDocument();
      expect(screen.getByText("Test Entity")).toBeInTheDocument();
    });
  });

  it("renders error state when organization fetch fails", async () => {
    mockOrganizationsApi.getById.mockRejectedValue(new Error("API Error"));
    mockEntitiesApi.getAll.mockResolvedValue([]);

    renderWithQueryClient(<OrganizationDetailPage {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Error loading organization"),
      ).toBeInTheDocument();
    });
  });

  it("can create a new entity", async () => {
    const mockOrganization = {
      id: "1",
      name: "Test Organization",
      domain: "test.com",
      billingEmail: "billing@test.com",
      status: "ACTIVE",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const mockEntities = [];
    const newEntity = {
      id: "2",
      organizationId: "1",
      name: "New Entity",
      description: "New entity description",
      billingModel: "PREPAID_CREDITS",
      status: "ACTIVE",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    mockOrganizationsApi.getById.mockResolvedValue(mockOrganization);
    mockEntitiesApi.getAll.mockResolvedValue(mockEntities);
    mockEntitiesApi.create.mockResolvedValue(newEntity);

    renderWithQueryClient(<OrganizationDetailPage {...mockProps} />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Create Entity")).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "New Entity" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New entity description" },
    });
    fireEvent.change(screen.getByLabelText("Billing Model"), {
      target: { value: "PREPAID_CREDITS" },
    });

    // Submit form
    fireEvent.click(screen.getByText("Create Entity"));

    await waitFor(() => {
      expect(mockEntitiesApi.create).toHaveBeenCalledWith({
        organizationId: "1",
        name: "New Entity",
        description: "New entity description",
        billingModel: "PREPAID_CREDITS",
      });
    });
  });

  it("can delete an entity", async () => {
    const mockOrganization = {
      id: "1",
      name: "Test Organization",
      domain: "test.com",
      billingEmail: "billing@test.com",
      status: "ACTIVE",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const mockEntities = [
      {
        id: "1",
        organizationId: "1",
        name: "Test Entity",
        description: "Test entity description",
        billingModel: "PAY_AS_YOU_GO",
        status: "ACTIVE",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    ];

    mockOrganizationsApi.getById.mockResolvedValue(mockOrganization);
    mockEntitiesApi.getAll.mockResolvedValue(mockEntities);
    mockEntitiesApi.delete.mockResolvedValue();

    renderWithQueryClient(<OrganizationDetailPage {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Test Entity")).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockEntitiesApi.delete).toHaveBeenCalledWith("1");
    });
  });
});
