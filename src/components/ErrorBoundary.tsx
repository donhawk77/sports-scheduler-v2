import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
                        <p className="text-text-muted text-sm mb-6">
                            We're sorry, but an unexpected error occurred. Please try reloading the page.
                        </p>
                        {this.state.error && (
                            <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-40">
                                <p className="text-red-400 font-mono text-xs">{this.state.error.toString()}</p>
                            </div>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" /> Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
