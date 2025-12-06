import * as Sentry from '@sentry/react';

/**
 * Sentry APM Service
 * 
 * Features:
 * - Error tracking and reporting
 * - Performance monitoring
 * - User context tracking
 * - Breadcrumb logging
 * - Custom transactions
 */

export interface SentryConfig {
    dsn: string;
    environment: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
}

export const sentryService = {
    /**
     * Initialize Sentry SDK
     */
    initialize(config: SentryConfig): void {
        if (!config.dsn) {
            console.warn('Sentry DSN not configured. Monitoring disabled.');
            return;
        }

        Sentry.init({
            dsn: config.dsn,
            environment: config.environment,

            // Performance Monitoring
            tracesSampleRate: config.tracesSampleRate || 0.2, // 20% of transactions

            // Session Replay
            replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1, // 10% of sessions
            replaysOnErrorSampleRate: 1.0, // 100% of error sessions

            // Integrations
            integrations: [
                new Sentry.BrowserTracing({
                    // Track all routing changes
                    routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                        // @ts-ignore - React Router hooks
                        React.useEffect,
                        // @ts-ignore
                        useLocation,
                        // @ts-ignore
                        useNavigationType,
                        // @ts-ignore
                        createRoutesFromChildren,
                        // @ts-ignore
                        matchRoutes
                    ),
                }),
                new Sentry.Replay({
                    maskAllText: false,
                    blockAllMedia: false,
                }),
            ],

            // Error filtering
            beforeSend(event, hint) {
                // Don't send errors in development
                if (config.environment === 'development') {
                    console.error('Sentry Error (not sent):', hint.originalException || event);
                    return null;
                }

                // Filter out known non-critical errors
                const error = hint.originalException;
                if (error instanceof Error) {
                    // Only ignore network errors in development, report them in production
                    if (error.message.includes('NetworkError') && config.environment === 'development') {
                        return null;
                    }

                    // Ignore canceled requests (user-initiated)
                    if (error.message.includes('AbortError') || error.message.includes('canceled')) {
                        return null;
                    }

                    // Ignore known browser extension errors
                    if (error.message.includes('Extension context invalidated')) {
                        return null;
                    }

                    // Ignore ResizeObserver errors (browser rendering, not critical)
                    if (error.message.includes('ResizeObserver loop')) {
                        return null;
                    }
                }

                return event;
            },
        });

        console.log('Sentry initialized:', config.environment);
    },

    /**
     * Set user context for error reports
     */
    setUserContext(user: { id: string; email?: string; name?: string }): void {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.name,
        });
    },

    /**
     * Clear user context (on logout)
     */
    clearUserContext(): void {
        Sentry.setUser(null);
    },

    /**
     * Manually capture an error
     */
    captureError(error: Error, context?: Record<string, any>): void {
        if (context) {
            Sentry.setContext('custom', context);
        }
        Sentry.captureException(error);
    },

    /**
     * Capture a message (not an error)
     */
    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
        Sentry.captureMessage(message, level);
    },

    /**
     * Add breadcrumb for debugging
     */
    addBreadcrumb(message: string, data?: Record<string, any>, category?: string): void {
        Sentry.addBreadcrumb({
            message,
            data,
            category: category || 'custom',
            level: 'info',
        });
    },

    /**
     * Start a performance transaction
     */
    startTransaction(name: string, op: string = 'custom'): Sentry.Transaction {
        return Sentry.startTransaction({
            name,
            op,
        });
    },

    /**
     * Track API call performance
     */
    async trackApiCall<T>(
        name: string,
        apiCall: () => Promise<T>
    ): Promise<T> {
        const transaction = Sentry.startTransaction({
            name: `API: ${name}`,
            op: 'http.client',
        });

        try {
            const result = await apiCall();
            transaction.setStatus('ok');
            return result;
        } catch (error) {
            transaction.setStatus('internal_error');
            throw error;
        } finally {
            transaction.finish();
        }
    },

    /**
     * Track component render performance
     */
    withProfiler<P extends object>(
        Component: React.ComponentType<P>,
        componentName: string
    ): React.ComponentType<P> {
        return Sentry.withProfiler(Component, { name: componentName });
    },

    /**
     * Set custom tags
     */
    setTag(key: string, value: string): void {
        Sentry.setTag(key, value);
    },

    /**
     * Set multiple tags
     */
    setTags(tags: Record<string, string>): void {
        Sentry.setTags(tags);
    },

    /**
     * Set custom context
     */
    setContext(name: string, context: Record<string, any>): void {
        Sentry.setContext(name, context);
    },

    /**
     * Track navigation
     */
    trackNavigation(from: string, to: string): void {
        this.addBreadcrumb(`Navigation: ${from} → ${to}`, { from, to }, 'navigation');
    },

    /**
     * Track user action
     */
    trackAction(action: string, data?: Record<string, any>): void {
        this.addBreadcrumb(`Action: ${action}`, data, 'user');
    },

    /**
     * Track feature usage
     */
    trackFeature(feature: string, data?: Record<string, any>): void {
        this.addBreadcrumb(`Feature: ${feature}`, data, 'feature');
        this.setContext('feature', { name: feature, ...data });
    },
};

// Export Sentry for advanced usage
export { Sentry };
