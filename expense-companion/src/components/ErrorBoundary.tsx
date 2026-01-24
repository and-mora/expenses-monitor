import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary component
 * Catches JavaScript errors anywhere in the component tree,
 * logs them, and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send error to monitoring service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-xl font-bold">
                Oops! Something went wrong
              </AlertTitle>
              <AlertDescription className="mt-2">
                We're sorry, but something unexpected happened. The error has been logged
                and we'll look into it.
              </AlertDescription>
            </Alert>

            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">What you can do:</h3>
              
              <div className="flex flex-wrap gap-3">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button onClick={this.handleReload} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {import.meta.env.DEV && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="bg-muted p-3 rounded font-mono overflow-auto">
                      <div className="font-bold text-destructive mb-2">
                        {error.name}: {error.message}
                      </div>
                      {error.stack && (
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {error.stack}
                        </pre>
                      )}
                    </div>
                    {errorInfo && errorInfo.componentStack && (
                      <div className="bg-muted p-3 rounded font-mono overflow-auto">
                        <div className="font-bold mb-2">Component Stack:</div>
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {!import.meta.env.DEV && (
                <p className="text-sm text-muted-foreground mt-4">
                  If the problem persists, please contact support with the time of the
                  error: <strong>{new Date().toLocaleString()}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
