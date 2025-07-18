import { render, screen, act } from '@testing-library/react';
import BillingPage from '../page';

// Mock the API
jest.mock('@/lib/api', () => ({
  apiClient: {
    getBillingJobs: jest.fn().mockResolvedValue([]),
    runBilling: jest.fn().mockResolvedValue({ message: 'Billing job started' }),
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('Billing Page', () => {
  it('renders billing page', async () => {
await act(async () => {
      render(<BillingPage />);
    });

    expect(screen.getByText('Billing Jobs')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<BillingPage />);
    
    expect(screen.getByText('Loading billing jobs...')).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests for:
  // - Billing job list display
  // - Run billing job functionality
  // - Billing job status updates
  // - Error handling
  // - Date filtering
  // - Job details view
});
