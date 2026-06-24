/**
 * EmptyState component — shown when no services are configured.
 *
 * Provides a clear call-to-action to add the first service.
 * Uses PatternFly's EmptyState components for visual consistency.
 */

import React from 'react';
import {
  EmptyState as PfEmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateActions,
} from '@patternfly/react-core';
import { Button } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { _ } from '../lib/i18n';

export interface EmptyStateProps {
  /** Called when user clicks the Add Service button */
  onAddService: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddService }) => {
  return (
    <PfEmptyState className="servicenav-empty">
      <EmptyStateIcon icon={CubesIcon} />
      <EmptyStateBody>
        {_('No services configured yet. Add your first service to get started.')}
      </EmptyStateBody>
      <EmptyStateActions>
        <Button variant="primary" onClick={onAddService}>
          {_('Add Service')}
        </Button>
      </EmptyStateActions>
    </PfEmptyState>
  );
};

export default EmptyState;
