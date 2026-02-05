import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Settings from './Settings';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    keycloak: {
      tokenParsed: {
        preferred_username: 'testuser',
        email: 'test@example.com',
      },
    },
    logout: vi.fn(),
    authenticated: true,
    initialized: true,
  }),
}));

// Mock react-router-dom useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/settings',
    }),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders settings page with title', () => {
    render(<Settings />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(/customize your experience/i)).toBeInTheDocument();
  });

  it('renders display settings card', () => {
    render(<Settings />, { wrapper: createWrapper() });

    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText(/choose how transactions are displayed/i)).toBeInTheDocument();
  });

  it('renders layout options', () => {
    render(<Settings />, { wrapper: createWrapper() });

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText(/transactions grouped by date/i)).toBeInTheDocument();
    expect(screen.getByText(/traditional table view/i)).toBeInTheDocument();
  });

  it('defaults to timeline layout when no preference is stored', () => {
    render(<Settings />, { wrapper: createWrapper() });

    const timelineRadio = screen.getByRole('radio', { name: /timeline/i });
    expect(timelineRadio).toBeChecked();
  });

  it('loads stored layout preference from localStorage', () => {
    window.localStorage.setItem('transactions-layout', 'list');
    
    render(<Settings />, { wrapper: createWrapper() });

    const listRadio = screen.getByRole('radio', { name: /list/i });
    expect(listRadio).toBeChecked();
  });

  it('saves layout preference to localStorage when changed', async () => {
    const user = userEvent.setup();
    
    render(<Settings />, { wrapper: createWrapper() });

    // Click on list option
    const listOption = screen.getByLabelText(/list/i);
    await user.click(listOption);

    expect(window.localStorage.getItem('transactions-layout')).toBe('list');
  });

  it('allows switching between timeline and list layouts', async () => {
    const user = userEvent.setup();
    
    render(<Settings />, { wrapper: createWrapper() });

    // Initially timeline should be selected
    const timelineRadio = screen.getByRole('radio', { name: /timeline/i });
    expect(timelineRadio).toBeChecked();

    // Click on list
    const listLabel = screen.getByText('List').closest('label');
    await user.click(listLabel!);

    const listRadio = screen.getByRole('radio', { name: /list/i });
    expect(listRadio).toBeChecked();
    expect(timelineRadio).not.toBeChecked();

    // Click back on timeline
    const timelineLabel = screen.getByText('Timeline').closest('label');
    await user.click(timelineLabel!);

    expect(timelineRadio).toBeChecked();
    expect(listRadio).not.toBeChecked();
  });
});
