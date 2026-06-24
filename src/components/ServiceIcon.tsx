/**
 * ServiceIcon — displays a service's favicon via <img> tag.
 * Browser handles .ico format natively. No async fetching.
 */

import React from 'react';
import type { ServiceEntry } from '../lib/types';
import { useIconFetcher } from '../hooks/useIconFetcher';

export interface ServiceIconProps {
  service: ServiceEntry;
  size?: 'sm' | 'md' | 'lg';
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ service, size = 'md' }) => {
  const { iconSrc } = useIconFetcher(service);

  const containerClass =
    size === 'sm'
      ? 'servicenav-card__icon servicenav-card__icon--sm'
      : 'servicenav-card__icon';

  // No icon URL — nothing to show
  if (!iconSrc) {
    return <div className={containerClass} />;
  }

  // Simple <img> — browser handles .ico, loading, errors natively
  return (
    <div className={containerClass}>
      <img
        src={iconSrc}
        alt={`${service.name} icon`}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

export default ServiceIcon;
