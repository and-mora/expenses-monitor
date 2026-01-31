import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    keycloak: {
      tokenParsed: {
        preferred_username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    logout: vi.fn(),
    authenticated: true,
    initialized: true,
  }),
}));

describe('Header Component', () => {
  describe('Rendering', () => {
    it('should render logo and app name', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.getByText(/expenses/i)).toBeInTheDocument();
      expect(screen.getByText(/monitor/i)).toBeInTheDocument();
    });

    it('should render navigation items', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/transactions/i)).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    it('should render user menu', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render Dashboard link with correct href', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/');
    });

    it('should render Transactions link with correct href', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      const transactionsLink = screen.getByRole('link', { name: /transactions/i });
      expect(transactionsLink).toHaveAttribute('href', '/transactions');
    });

    it('should render Settings link with correct href', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });
  });

  describe('Active State', () => {
    it('should highlight Dashboard when on home route', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should highlight Transactions when on transactions route', () => {
      render(
        <MemoryRouter initialEntries={['/transactions']}>
          <Header />
        </MemoryRouter>
      );

      const transactionsLink = screen.getByRole('link', { name: /transactions/i });
      expect(transactionsLink).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should highlight Settings when on settings route', () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <Header />
        </MemoryRouter>
      );

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should not highlight non-active routes', () => {
      render(
        <MemoryRouter initialEntries={['/transactions']}>
          <Header />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveClass('bg-primary');
      expect(dashboardLink).toHaveClass('text-muted-foreground');
    });
  });

  describe('User Menu Interactions', () => {
    it('should open dropdown menu when user button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);

      expect(screen.getByText(/my account/i)).toBeInTheDocument();
      expect(screen.getByText(/log out/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate to Dashboard when Dashboard link is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/transactions']}>
          <Header />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      await user.click(dashboardLink);

      // Link should have correct href
      expect(dashboardLink).toHaveAttribute('href', '/');
    });

    it('should navigate to Transactions when Transactions link is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>
      );

      const transactionsLink = screen.getByRole('link', { name: /transactions/i });
      await user.click(transactionsLink);

      // Link should have correct href
      expect(transactionsLink).toHaveAttribute('href', '/transactions');
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide navigation on mobile (hidden md:flex)', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('hidden', 'md:flex');
    });
  });

  describe('User Display', () => {
    it('should show username from token', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('should show email from token', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show first letter of username as avatar', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      // Look for avatar with "T" (first letter of "testuser")
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className prop', () => {
      const { container } = render(
        <BrowserRouter>
          <Header className="custom-class" />
        </BrowserRouter>
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('custom-class');
    });
  });
});
