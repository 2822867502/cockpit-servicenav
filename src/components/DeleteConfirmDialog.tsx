/**
 * DeleteConfirmDialog component — modal confirmation before removing a service.
 *
 * Safety measure to prevent accidental deletions. Shows the service name
 * and requires explicit confirmation.
 */

import React from 'react';
import { Modal, Button } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import type { ServiceEntry } from '../lib/types';
import { _ } from '../lib/i18n';

export interface DeleteConfirmDialogProps {
  /** The service to be deleted */
  service: ServiceEntry;
  /** Called when user confirms deletion */
  onConfirm: () => void;
  /** Called when user cancels or closes the dialog */
  onClose: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  service,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal
      variant="small"
      title={
        <span>
          <ExclamationTriangleIcon
            style={{ color: 'var(--pf-v5-global--warning-color--100)', marginRight: 8 }}
          />
          {_('Delete Service')}
        </span>
      }
      titleIconVariant="warning"
      isOpen={true}
      onClose={onClose}
      actions={[
        <Button key="confirm" variant="danger" onClick={onConfirm}>
          {_('Delete')}
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          {_('Cancel')}
        </Button>,
      ]}
      aria-label={_('Delete service confirmation')}
    >
      <p>
        {_('Are you sure you want to delete the service')}{' '}
        <strong>&ldquo;{service.name}&rdquo;</strong>?
      </p>
      <p style={{ color: 'var(--pf-v5-global--Color--200)', fontSize: '0.875rem' }}>
        {_('This action cannot be undone. The service link will be removed from the navigation panel.')}
      </p>
    </Modal>
  );
};

export default DeleteConfirmDialog;
