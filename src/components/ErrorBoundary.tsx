/**
 * ErrorBoundary — React error boundary for defensive rendering.
 *
 * Catches any unhandled errors in the component tree below it,
 * preventing them from propagating to Cockpit's global error handler
 * (which would show the "Oops" notification).
 *
 * When an error is caught, shows a minimal fallback UI with a
 * retry button instead of crashing the entire page.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateActions,
  Button,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { _ } from '../lib/i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || String(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for debugging but NEVER re-throw —
    // re-throwing would reach Cockpit's global handler and show "Oops"
    console.error(
      '[servicenav] ErrorBoundary caught an error:',
      error?.message || error,
      '\nComponent stack:',
      errorInfo?.componentStack || '(not available)'
    );
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <EmptyState>
          <EmptyStateIcon icon={ExclamationCircleIcon} color="var(--pf-v5-global--danger-color--100)" />
          <EmptyStateBody>
            {_('An unexpected error occurred while loading the service navigation panel.')}
          </EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={this.handleRetry}>
              {_('Retry')}
            </Button>
          </EmptyStateActions>
        </EmptyState>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
