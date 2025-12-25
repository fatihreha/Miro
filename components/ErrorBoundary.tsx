import React, { Component, ErrorInfo, ReactNode } from "react";
import { sentryService } from "../services/sentryService";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

// ErrorBoundary component - uses workaround for ES2022 class fields tsconfig issue
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        (this as Component<ErrorBoundaryProps, ErrorBoundaryState>).state = {
            hasError: false
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Report to Sentry for production monitoring
        sentryService.captureError(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true
        });
    }

    render(): ReactNode {
        const currentState = (this as Component<ErrorBoundaryProps, ErrorBoundaryState>).state;
        const currentProps = (this as Component<ErrorBoundaryProps, ErrorBoundaryState>).props;

        if (currentState.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                    <div className="max-w-md w-full bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
                        <h2 className="text-xl font-bold text-red-500 mb-4">Uygulama Hatası</h2>
                        <p className="text-gray-300 mb-4">Beklenmeyen bir hata oluştu.</p>
                        <div className="bg-black/50 p-4 rounded text-xs font-mono mb-6 overflow-auto max-h-60 whitespace-pre-wrap">
                            {currentState.error?.message || 'Bilinmeyen Hata'}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-colors"
                        >
                            Uygulamayı Yeniden Başlat
                        </button>
                    </div>
                </div>
            );
        }

        return currentProps.children;
    }
}
