import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70dvh] flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-sm">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-headline font-black text-xl text-slate-900">
                Application Interruption
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                An unexpected render error occurred. Your on-chain funds and contracts remain safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 text-left max-h-24 overflow-y-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 min-h-[44px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <RotateCcw size={14} />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                className="w-full sm:flex-1 py-3 px-4 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Home size={14} />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
