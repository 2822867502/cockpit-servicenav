/**
 * ServiceListItem component — displays a single service as a DataList row.
 *
 * Used in the list view layout. More compact than the card view.
 * Shows icon, name, description, URL, and action buttons in a table-like row.
 */

import React from 'react';
import {
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  DataListAction,
  Button,
} from '@patternfly/react-core';
import { PencilAltIcon, TimesIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import type { ServiceEntry, HttpsMode } from '../lib/types';
import { resolveServiceUrl, extractPort } from '../lib/url';
import { _ } from '../lib/i18n';
import { ServiceIcon } from './ServiceIcon';

export interface ServiceListItemProps {
  service: ServiceEntry;
  httpsMode?: HttpsMode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ServiceListItem: React.FC<ServiceListItemProps> = ({
  service,
  onEdit,
  onDelete,
}) => {
  const resolvedUrl = resolveServiceUrl(service.url, httpsMode);
  const port = extractPort(service.url);

  const handleOpen = () => {
    if (resolvedUrl) {
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <DataListItem aria-label={service.name}>
      <DataListItemRow>
        <DataListItemCells
          dataListCells={[
            <DataListCell key="icon" className="servicenav-list__icon-cell">
              <ServiceIcon service={service} size="sm" />
            </DataListCell>,
            <DataListCell key="name" width={2}>
              <strong>{service.name}</strong>
              {service.description && (
                <div style={{ color: 'var(--pf-v5-global--Color--200)', fontSize: '0.8rem' }}>
                  {service.description}
                </div>
              )}
            </DataListCell>,
            <DataListCell key="url" width={3}>
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <ExternalLinkAltIcon />
                <span>{port ? `${_('Port')}: ${port}` : resolvedUrl}</span>
              </a>
            </DataListCell>,
          ]}
        />
        <DataListAction
          id={`actions-${service.id}`}
          aria-label={_('Actions for') + ' ' + service.name}
          aria-labelledby={`actions-${service.id}`}
        >
          <Button
            variant="secondary"
            onClick={() => onEdit(service.id)}
            aria-label={_('Edit') + ' ' + service.name}
          >
            <PencilAltIcon />
          </Button>
          <Button
            variant="danger"
            onClick={() => onDelete(service.id)}
            aria-label={_('Delete') + ' ' + service.name}
          >
            <TimesIcon />
          </Button>
        </DataListAction>
      </DataListItemRow>
    </DataListItem>
  );
};

export default ServiceListItem;
