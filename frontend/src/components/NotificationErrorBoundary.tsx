import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Bell } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class NotificationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[NotificationErrorBoundary] Caught notification error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative inline-block">
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F6F7F9] transition-colors cursor-pointer"
            title="Notifications temporarily unavailable"
            onClick={() => this.setState({ hasError: false })}
          >
            <Bell size={16} />
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
