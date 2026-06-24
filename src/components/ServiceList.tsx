/**
 * ServiceList component — displays services in a table-like list layout.
 *
 * Uses PatternFly's DataList component. More compact than the grid view,
 * suitable for many services or users who prefer a denser layout.
 */

import React from 'react';
import { DataList } from '@patternfly/react-core';
import type { ServiceEntry } from '../lib/types';
import { ServiceListItem } from './ServiceListItem';

export interface ServiceListProps {
  /** Array of services to display */
  services: ServiceEntry[];
  /** Called when user clicks edit on a service */
  onEdit: (id: string) => void;
  /** Called when user clicks delete on a service */
  onDelete: (id: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ services, onEdit, onDelete }) => {
  return (
    <DataList aria-label="Service navigation list" isCompact>
      {services.map((service) => (
        <ServiceListItem
          key={service.id}
          service={service}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </DataList>
  );
};

export default ServiceList;
