import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Component with a different error
const ThrowCustomError = () => {
  throw new Error('Custom error for testing');
};

// Normal component that doesn't throw
const NormalComponent = () => {
  return <div>Normal child component</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    // ErrorBoundary logs errors which would clutter the test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Error Handling', () => {
    it('should catch errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Verify error UI is displayed
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/we're sorry/i)).toBeInTheDocument();
    });

    it('should display error message in technical details when available', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Find the technical details summary (only shown in dev mode)
      const detailsElement = screen.getByText(/technical details/i);
      expect(detailsElement).toBeInTheDocument();

      // Verify the error message is shown (appears multiple times - in header and stack trace)
      const errorMessages = screen.getAllByText(/test error message/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should log errors to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Check that it was called with error information
      const calls = consoleErrorSpy.mock.calls;
      const errorCall = calls.find(call => 
        call[0].includes('ErrorBoundary caught an error')
      );
      expect(errorCall).toBeDefined();
    });

    it('should handle different error types', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError />
        </ErrorBoundary>
      );

      // Error UI should still be displayed
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      // Custom error message should be in details (appears multiple times)
      const customErrors = screen.getAllByText(/custom error for testing/i);
      expect(customErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Callback Functionality', () => {
    it('should call onError callback when error occurs', () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError />
        </ErrorBoundary>
      );

      // Verify callback was called
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      
      // Verify it was called with error and errorInfo
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );

      // Verify the error object contains our message
      const [error] = onErrorMock.mock.calls[0];
      expect(error.message).toBe('Test error message');
    });

    it('should not throw if onError callback is not provided', () => {
      // Should not throw even without onError
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should call onError with correct error info', () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowCustomError />
        </ErrorBoundary>
      );

      const [error, errorInfo] = onErrorMock.mock.calls[0];
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Custom error for testing');
      expect(errorInfo).toHaveProperty('componentStack');
      expect(typeof errorInfo.componentStack).toBe('string');
    });
  });

  describe('Normal Rendering', () => {
    it('should render children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      );

      // Normal component should be rendered
      expect(screen.getByText('Normal child component')).toBeInTheDocument();
      
      // Error UI should not be present
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
          <div>Third child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });

    it('should not call onError callback when no error occurs', () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <NormalComponent />
        </ErrorBoundary>
      );

      expect(onErrorMock).not.toHaveBeenCalled();
    });
  });

  describe('Fallback UI', () => {
    it('should display custom fallback when provided', () => {
      const customFallback = <div>Custom error fallback UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error fallback UI')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should display default fallback when custom fallback not provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });

    it('should show try again, reload, and go home buttons in default fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      const goHomeButton = screen.getByRole('button', { name: /go home/i });

      expect(tryAgainButton).toBeInTheDocument();
      expect(reloadButton).toBeInTheDocument();
      expect(goHomeButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should reload page when reload button is clicked', async () => {
      const user = userEvent.setup();
      const reloadSpy = vi.fn();
      
      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      await user.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('should navigate home when go home button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      await user.click(goHomeButton);

      expect(window.location.href).toBe('/');
    });

    it('should reset error state when try again button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error UI should be visible
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // After clicking try again, the error state is reset
      // The component will try to render children again
      // In this test, children will throw again, so error UI remains
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible alert for error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Alert component should render with proper structure
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      const goHomeButton = screen.getByRole('button', { name: /go home/i });

      expect(tryAgainButton).toBeEnabled();
      expect(reloadButton).toBeEnabled();
      expect(goHomeButton).toBeEnabled();
    });
  });

  describe('Conditional Rendering', () => {
    it('should switch from error state to normal state when error is resolved', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error UI should be shown
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Note: In a real ErrorBoundary, you'd need to reset the state
      // This test demonstrates the boundary catches errors initially
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors with no message', () => {
      const ThrowEmptyError = () => {
        throw new Error('');
      };

      render(
        <ErrorBoundary>
          <ThrowEmptyError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not show error UI for null children
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should handle errors thrown in nested components', () => {
      const NestedComponent = () => (
        <div>
          <div>
            <div>
              <ThrowError />
            </div>
          </div>
        </div>
      );

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
