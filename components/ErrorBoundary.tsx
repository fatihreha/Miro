import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Sentry } from '../services/sentryService';
import { GlassCard, GlassButton } from './ui/Glass';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors and reports them to Sentry
 * Shows user-friendly fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Error Boundary caught:', error, errorInfo);

        // Report to Sentry
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                    <GlassCard className="max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Bir Hata Oluştu</h1>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Üzgünüz, bir şeyler ters gitti. Hata otomatik olarak raporlandı.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                                <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="text-xs text-gray-600 dark:text-gray-400">
                                        <summary className="cursor-pointer">Stack Trace</summary>
                                        <pre className="mt-2 overflow-auto max-h-40">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <GlassButton
                                onClick={this.handleReset}
                                className="flex-1 bg-blue-500 text-white py-3"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Tekrar Dene
                            </GlassButton>

                            <GlassButton
                                onClick={this.handleGoHome}
                                className="flex-1 border border-gray-300 dark:border-gray-600 py-3"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Ana Sayfa
                            </GlassButton>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            Sorun devam ederse lütfen destek ekibimizle iletişime geçin.
                        </p>
                    </GlassCard>
                </div>
            );
        }

        return this.props.children;
    }
}
