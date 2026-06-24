/**
 * ServiceGrid component — displays services in a responsive card grid.
 *
 * Uses PatternFly's Gallery component for automatic responsive layout.
 * Cards reflow based on available width.
 */

import React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import type { ServiceEntry, HttpsMode } from '../lib/types';
import { ServiceCard } from './ServiceCard';

export interface ServiceGridProps {
  services: ServiceEntry[];
  httpsMode?: HttpsMode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ services, httpsMode, onEdit, onDelete }) => {
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
            httpsMode={httpsMode}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </GalleryItem>
      ))}
    </Gallery>
  );
};

export default ServiceGrid;
