import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRenderSafety } from '@/lib/render-safety';
import { ErrorHandler, AppError, NetworkError } from '@/lib/error-handling';
import { NetworkStatusIndicator } from '@/components/OfflineNotification';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
  errorType: 'network' | 'render' | 'validation' | 'unknown';
  canRetry: boolean;
  isRecovering: boolean;
}

/**
 * Hardened Error Boundary with Render Loop Detection
 * 
 * Features:
 * - Detects and recovers from render loops
 * - Tracks error frequency to prevent infinite error loops
 * - Provides graceful fallback UI
 * - Logs detailed error information for debugging
 */
export class HardenedErrorBoundary extends Component<Props, State> {
  private errorCountWindow = 10000; // 10 seconds
  private maxErrorsPerWindow = 5;
  private errorHistory: number[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
      errorType: 'unknown',
      canRetry: true,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    
    // Add to error history
    this.errorHistory.push(now);
    
    // Clean old errors outside the window
    this.errorHistory = this.errorHistory.filter(
      time => now - time < this.errorCountWindow
    );
    
    // Determine error type and recovery strategy
    const processedError = ErrorHandler.handle(error);
    const errorType = this.categorizeError(processedError);
    const canRetry = this.canRetryError(errorType, this.errorHistory.length);
    
    // Check if we're in an error loop
    if (this.errorHistory.length > this.maxErrorsPerWindow) {
      console.error('🚨 ERROR_BOUNDARY: Error loop detected! Too many errors in short time period.');
      console.error('🚨 ERROR_BOUNDARY: Entering safe mode - blocking further renders to prevent browser freeze.');
      
      // Force a page reload as last resort
      setTimeout(() => {
        console.error('🚨 ERROR_BOUNDARY: Reloading page to recover from error loop...');
        window.location.reload();
      }, 3000);
    }

    this.setState({
      error: processedError,
      errorInfo,
      errorCount: this.errorHistory.length,
      lastErrorTime: now,
      errorType,
      canRetry,
      isRecovering: false,
    });

    // Log detailed error information
    console.group('🚨 ERROR_BOUNDARY: Component Error Caught');
    console.error('Error:', processedError);
    console.error('Error Type:', errorType);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Count in Window:', this.errorHistory.length);
    console.error('Can Retry:', canRetry);
    console.groupEnd();

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Implement automatic recovery for certain error types
    if (errorType === 'network' && canRetry) {
      this.scheduleAutomaticRetry();
    }

    // Check if this looks like a render loop
    if (this.isRenderLoopError(error)) {
      console.error('🚨 ERROR_BOUNDARY: Render loop detected in error message!');
      this.handleRenderLoop();
    }
  }

  private categorizeError(error: Error): State['errorType'] {
    if (error instanceof NetworkError) {
      return 'network';
    }
    
    if (error instanceof AppError && error.code === 'VALIDATION_ERROR') {
      return 'validation';
    }
    
    if (this.isRenderLoopError(error)) {
      return 'render';
    }
    
    return 'unknown';
  }

  private canRetryError(errorType: State['errorType'], errorCount: number): boolean {
    switch (errorType) {
      case 'network':
        return errorCount < 3; // Allow more retries for network errors
      case 'validation':
        return errorCount < 2; // Limit retries for validation errors
      case 'render':
        return errorCount < 1; // Very limited retries for render errors
      default:
        return errorCount < 2; // Conservative for unknown errors
    }
  }

  private scheduleAutomaticRetry(): void {
    if (this.state.errorType === 'network' && this.state.canRetry) {
      console.log('🔄 ERROR_BOUNDARY: Scheduling automatic retry for network error...');
      
      setTimeout(() => {
        if (this.state.hasError && this.state.errorType === 'network') {
          this.setState({ isRecovering: true });
          setTimeout(() => this.handleRetry(), 1000);
        }
      }, 3000); // Wait 3 seconds before retrying
    }
  }

  private getErrorIcon(): string {
    switch (this.state.errorType) {
      case 'network':
        return '📡';
      case 'render':
        return '🔄';
      case 'validation':
        return '📝';
      default:
        return '⚠️';
    }
  }

  private getErrorTitle(): string {
    switch (this.state.errorType) {
      case 'network':
        return 'Connection Problem';
      case 'render':
        return 'Display Issue';
      case 'validation':
        return 'Data Issue';
      default:
        return 'Oops! Something went wrong';
    }
  }

  private getErrorMessage(): string {
    switch (this.state.errorType) {
      case 'network':
        return 'There was a problem connecting to our servers. Please check your internet connection and try again.';
      case 'render':
        return 'There was an issue displaying this page. The app might be in an unstable state.';
      case 'validation':
        return 'There was a problem with the data. Please refresh the page and try again.';
      default:
        return this.state.errorCount > 3 
          ? "We've detected multiple errors. The app might be in an unstable state."
          : "Don't worry, this happens sometimes. You can try refreshing the page.";
    }
  }

  private getRetryButtonText(): string {
    switch (this.state.errorType) {
      case 'network':
        return 'Retry Connection';
      case 'render':
        return 'Try Again';
      case 'validation':
        return 'Retry';
      default:
        return 'Try Again';
    }
  }

  private isRenderLoopError(error: Error): boolean {
    const renderLoopIndicators = [
      'Element type is invalid',
      'Cannot read properties of undefined',
      'Maximum update depth exceeded',
      'Too many re-renders',
      'Render loop',
      'useEffect'
    ];

    return renderLoopIndicators.some(indicator => 
      error.message.includes(indicator) || error.stack?.includes(indicator)
    );
  }

  private handleRenderLoop() {
    console.warn('🚨 ERROR_BOUNDARY: Implementing render loop recovery...');
    
    // Clear any potentially problematic localStorage
    try {
      localStorage.removeItem('party-store');
      console.log('✅ ERROR_BOUNDARY: Cleared party-store from localStorage');
    } catch (e) {
      console.warn('⚠️ ERROR_BOUNDARY: Could not clear localStorage:', e);
    }

    // Set a flag to indicate we're in recovery mode
    sessionStorage.setItem('render-loop-recovery', 'true');
  }

  private handleRetry = () => {
    console.log('🔄 ERROR_BOUNDARY: User initiated retry');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    });
  };

  private handleReload = () => {
    console.log('🔄 ERROR_BOUNDARY: User initiated page reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">
                  {this.getErrorIcon()}
                </span>
              </div>
              
              <h1 className="text-xl font-bold text-foreground mb-2">
                {this.getErrorTitle()}
              </h1>
              
              <p className="text-muted-foreground mb-4">
                {this.getErrorMessage()}
              </p>

              {/* Network status indicator for network errors */}
              {this.state.errorType === 'network' && (
                <div className="mb-4 p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-center gap-2">
                    <NetworkStatusIndicator showOnlineStatus={true} />
                  </div>
                </div>
              )}

              {/* Recovery indicator */}
              {this.state.isRecovering && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 text-sm">
                    🔄 Attempting automatic recovery...
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <details className="text-left mb-4 p-3 bg-muted rounded text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error Type:</strong> {this.state.errorType}
                    </div>
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-xs overflow-auto">{this.state.error?.message}</pre>
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="text-xs overflow-auto">{this.state.error?.stack}</pre>
                    </div>
                    <div>
                      <strong>Error Count:</strong> {this.state.errorCount}
                    </div>
                    <div>
                      <strong>Can Retry:</strong> {this.state.canRetry ? 'Yes' : 'No'}
                    </div>
                  </div>
                </details>
              )}

              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!this.state.canRetry || this.state.isRecovering}
                >
                  {this.state.isRecovering 
                    ? 'Recovering...' 
                    : !this.state.canRetry 
                      ? 'Too Many Errors' 
                      : this.getRetryButtonText()
                  }
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {!this.state.canRetry && (
                <p className="text-xs text-muted-foreground mt-4">
                  Multiple errors detected. Please reload the page to reset the application.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based component wrapper for render safety monitoring
 */
export function RenderSafetyMonitor({ 
  children, 
  componentName = 'Unknown' 
}: { 
  children: ReactNode; 
  componentName?: string; 
}) {
  const renderCount = useRenderSafety(componentName);
  
  // Show warning overlay if too many renders detected in development
  if (process.env.NODE_ENV === 'development' && renderCount > 20) {
    return (
      <div className="relative">
        {children}
        <div className="fixed top-4 right-4 bg-yellow-500 text-black p-2 rounded-md shadow-lg z-50 text-sm">
          ⚠️ {componentName}: {renderCount} renders
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for render safety
 */
export function withRenderSafety<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const SafeComponent = (props: P) => {
    return (
      <HardenedErrorBoundary>
        <RenderSafetyMonitor componentName={componentName || WrappedComponent.name}>
          <WrappedComponent {...props} />
        </RenderSafetyMonitor>
      </HardenedErrorBoundary>
    );
  };

  SafeComponent.displayName = `withRenderSafety(${componentName || WrappedComponent.name})`;
  return SafeComponent;
}