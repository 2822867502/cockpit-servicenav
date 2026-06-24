/**
 * ServiceGrid component — displays services in a responsive card grid.
 *
 * Uses PatternFly's Gallery component for automatic responsive layout.
 * Cards reflow based on available width.
 */

import React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import type { ServiceEntry } from '../lib/types';
import { ServiceCard } from './ServiceCard';

export interface ServiceGridProps {
  /** Array of services to display */
  services: ServiceEntry[];
  /** Called when user clicks edit on a service */
  onEdit: (id: string) => void;
  /** Called when user clicks delete on a service */
  onDelete: (id: string) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ services, onEdit, onDelete }) => {
  const safeServices = Array.isArray(services) ? services : [];
  return (
    <Gallery
      hasGutter
      minWidths={{
        default: '300px',
        xl: '350px',
      }}
    >
      {safeServices.map((service) => (
        <GalleryItem key={service.id}>
          <ServiceCard
            service={service}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </GalleryItem>
      ))}
    </Gallery>
  );
};

export default ServiceGrid;
