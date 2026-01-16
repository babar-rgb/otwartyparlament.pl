
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // Here we can also log to Sentry/LogRocket in production
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                    <div className="max-w-lg w-full bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl text-center">

                        <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 mb-6 animate-pulse">
                            <AlertTriangle size={48} />
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                            Wystąpił nieoczekiwany błąd.
                        </h1>

                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            Wystąpił nieoczekiwany błąd aplikacji. Przepraszamy za utrudnienia.
                            Prosimy odświeżyć stronę lub spróbować ponownie później.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
                            >
                                <RefreshCw size={20} />
                                Odśwież stronę
                            </button>

                            <a
                                href="/"
                                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-all"
                            >
                                <Home size={20} />
                                Strona główna
                            </a>
                        </div>

                        {this.state.error && (
                            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg text-left overflow-auto max-h-40">
                                <p className="text-xs font-mono text-slate-500 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
