import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrganizationsPage from '../page';
import { organizationsApi } from '@/lib/api/organizations';

// Mock the API
jest.mock('@/lib/api/organizations', () => ({
  organizationsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock organization components
jest.mock('@/components/OrganizationForm', () => ({
  OrganizationForm: ({ onSubmit, onCancel }: any) => (
    <div>
      <input aria-label="Name" />
      <input aria-label="Domain" />
      <input aria-label="Billing Email" />
      <select aria-label="Billing Model">
        <option value="PAY_AS_YOU_GO">Pay As You Go</option>
      </select>
      <button onClick={() => onSubmit({ name: 'New Organization', domain: 'new.com', billingEmail: 'new@billing.com', billingModel: 'PAY_AS_YOU_GO' })}>Create Organization</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock('@/components/OrganizationList', () => ({
  OrganizationList: ({ organizations, onDelete }: any) => (
    <div>
      {organizations.map((org: any) => (
        <div key={org.id}>
          <span>{org.name}</span>
          <span>{org.billingEmail}</span>
          <button onClick={() => onDelete(org.id)}>Delete</button>
        </div>
      ))}
      {organizations.length === 0 && <p>No organizations found.</p>}
    </div>
  ),
}));

const mockOrganizationsApi = organizationsApi as jest.Mocked<typeof organizationsApi>;

describe('Organizations Page', () => {
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
      </QueryClientProvider>
    );
  };

  it('renders organizations page with loading state', async () => {
    mockOrganizationsApi.getAll.mockImplementation(() => new Promise(() => {}));
    
    const { container } = renderWithQueryClient(<OrganizationsPage />);
    
    // Check for loading spinner using querySelector
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders organizations page with data', async () => {
    const mockOrganizations = [
      {
        id: '1',
        name: 'Test Organization',
        domain: 'test.com',
        billingEmail: 'billing@test.com',
        status: 'ACTIVE',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];

    mockOrganizationsApi.getAll.mockResolvedValue(mockOrganizations);

    renderWithQueryClient(<OrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
      expect(screen.getByText('billing@test.com')).toBeInTheDocument();
    });
  });

  it('renders error state when API fails', async () => {
    mockOrganizationsApi.getAll.mockRejectedValue(new Error('API Error'));

    renderWithQueryClient(<OrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch organizations')).toBeInTheDocument();
    });
  });

  it('can create a new organization', async () => {
    const mockOrganizations = [];
    const newOrganization = {
      id: '2',
      name: 'New Organization',
      domain: 'new.com',
      billingEmail: 'new@billing.com',
      status: 'ACTIVE',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    mockOrganizationsApi.getAll.mockResolvedValue(mockOrganizations);
    mockOrganizationsApi.create.mockResolvedValue(newOrganization);

    renderWithQueryClient(<OrganizationsPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Create Organization')).toBeInTheDocument();
    });

    // Click create organization button to show form
    fireEvent.click(screen.getByText('Create Organization'));

    // Wait for form to appear and fill it
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Organization' },
    });
    fireEvent.change(screen.getByLabelText('Domain'), {
      target: { value: 'new.com' },
    });
    fireEvent.change(screen.getByLabelText('Billing Email'), {
      target: { value: 'new@billing.com' },
    });
    fireEvent.change(screen.getByLabelText('Billing Model'), {
      target: { value: 'PAY_AS_YOU_GO' },
    });

    // Submit form (note: this will click the button in the form, not the header button)
    const submitButtons = screen.getAllByText('Create Organization');
    fireEvent.click(submitButtons[1]); // The submit button, not the header button

    await waitFor(() => {
      expect(mockOrganizationsApi.create).toHaveBeenCalledWith({
        name: 'New Organization',
        domain: 'new.com',
        billingEmail: 'new@billing.com',
        billingModel: 'PAY_AS_YOU_GO',
      });
    });
  });

  it('can delete an organization', async () => {
    const mockOrganizations = [
      {
        id: '1',
        name: 'Test Organization',
        domain: 'test.com',
        billingEmail: 'billing@test.com',
        status: 'ACTIVE',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];

    mockOrganizationsApi.getAll.mockResolvedValue(mockOrganizations);
    mockOrganizationsApi.delete.mockResolvedValue();

    renderWithQueryClient(<OrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockOrganizationsApi.delete).toHaveBeenCalledWith('1');
    });
  });
});
