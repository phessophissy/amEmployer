'use client';
import { Component, type ReactNode } from 'react';
interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  render() {
    if (this.state.error) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="text-4xl mb-4">⚠</div>
          <p className="text-slate-400 font-semibold mb-1">Something went wrong</p>
          <p className="text-xs text-slate-600 max-w-xs mb-4">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
