import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, you could send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: sendToErrorTracking(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDark = document.documentElement.classList.contains('dark');

      return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${
          isDark ? 'bg-stone-950' : 'bg-stone-50'
        }`}>
          <div className={`max-w-md w-full text-center p-8 rounded-2xl border ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}>
            {/* Icon */}
            <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isDark ? 'bg-red-500/20' : 'bg-red-100'
            }`}>
              <AlertTriangle size={32} className={isDark ? 'text-red-400' : 'text-red-600'} />
            </div>

            {/* Title */}
            <h1 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Something went wrong
            </h1>

            {/* Description */}
            <p className={`text-sm mb-6 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              An unexpected error occurred. Your data has been saved locally and should be safe.
            </p>

            {/* Error Details (Development) */}
            {import.meta.env.DEV && this.state.error && (
              <details className={`text-left mb-6 p-4 rounded-xl text-xs font-mono overflow-auto max-h-40 ${
                isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'
              }`}>
                <summary className="cursor-pointer flex items-center gap-2 mb-2">
                  <Bug size={14} />
                  Error Details
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className={`w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                  isDark 
                    ? 'bg-white text-stone-900 hover:bg-stone-100' 
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className={`w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border ${
                  isDark 
                    ? 'border-stone-700 text-stone-300 hover:bg-stone-800' 
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Home size={18} />
                Go to Homepage
              </button>
            </div>

            {/* Help Text */}
            <p className={`text-xs mt-6 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
