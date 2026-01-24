import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthGuard } from './AuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';
import keycloak from '@/config/keycloak';

describe('AuthGuard', () => {
  const mockChild = <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default authenticated state
    vi.mocked(keycloak.init).mockResolvedValue(true);
    keycloak.token = 'mock-token';
    keycloak.tokenParsed = {
      preferred_username: 'testuser',
      email: 'test@example.com',
    };
  });

  it('shows loading state while initializing', () => {
    vi.mocked(keycloak.init).mockReturnValue(
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(
      <AuthProvider>
        <AuthGuard>{mockChild}</AuthGuard>
      </AuthProvider>
    );

    expect(screen.getByText('Initializing...')).toBeInTheDocument();
    expect(screen.getByText('Connecting to authentication service')).toBeInTheDocument();
  });

  it('shows login screen when not authenticated', async () => {
    vi.mocked(keycloak.init).mockResolvedValue(false); // Not authenticated
    keycloak.token = undefined;
    keycloak.tokenParsed = undefined;

    render(
      <AuthProvider>
        <AuthGuard>{mockChild}</AuthGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Expenses Monitor')).toBeInTheDocument();
    });

    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('triggers login when sign in button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(keycloak.init).mockResolvedValue(false);
    keycloak.token = undefined;
    keycloak.tokenParsed = undefined;

    render(
      <AuthProvider>
        <AuthGuard>{mockChild}</AuthGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    const signInButton = screen.getByText('Sign In');
    await user.click(signInButton);

    expect(keycloak.login).toHaveBeenCalled();
  });

  it('shows protected content when authenticated', async () => {
    vi.mocked(keycloak.init).mockResolvedValue(true); // Authenticated
    keycloak.token = 'mock-token';
    keycloak.tokenParsed = {
      preferred_username: 'testuser',
      email: 'test@example.com',
    };

    render(
      <AuthProvider>
        <AuthGuard>{mockChild}</AuthGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('handles authentication error gracefully', async () => {
    vi.mocked(keycloak.init).mockRejectedValue(new Error('Auth failed'));
    keycloak.token = undefined;
    keycloak.tokenParsed = undefined;

    render(
      <AuthProvider>
        <AuthGuard>{mockChild}</AuthGuard>
      </AuthProvider>
    );

    // Should still show login after error
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});
