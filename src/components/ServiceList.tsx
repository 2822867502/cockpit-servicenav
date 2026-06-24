/**
 * ServiceList component — displays services in a table-like list layout.
 *
 * Uses PatternFly's DataList component. More compact than the grid view,
 * suitable for many services or users who prefer a denser layout.
 */

import React from 'react';
import { DataList } from '@patternfly/react-core';
import type { ServiceEntry, HttpsMode } from '../lib/types';
import { ServiceListItem } from './ServiceListItem';

export interface ServiceListProps {
  services: ServiceEntry[];
  httpsMode?: HttpsMode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ services, httpsMode, onEdit, onDelete }) => {
  const safeServices = Array.isArray(services) ? services : [];
  return (
    <DataList aria-label="Service navigation list" isCompact>
      {safeServices.map((service) => (
        <ServiceListItem
          key={service.id}
          service={service}
          httpsMode={httpsMode}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </DataList>
  );
};

export default ServiceList;
