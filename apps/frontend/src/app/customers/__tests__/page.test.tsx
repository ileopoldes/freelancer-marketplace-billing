import { render, screen, act } from '@testing-library/react';
import CustomersPage from '../page';

// Mock the API
jest.mock('@/lib/api', () => ({
  apiClient: {
    getCustomers: jest.fn().mockResolvedValue([]),
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('Customers Page', () => {
  it('renders customers page', async () => {
await act(async () => {
      render(<CustomersPage />);
    });

    expect(screen.getByText('Customers')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<CustomersPage />);
    
    expect(screen.getByText('Loading customers...')).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests for:
  // - Customer list display
  // - Customer creation
  // - Customer editing
  // - Customer deletion
  // - Error handling
  // - Pagination
});
