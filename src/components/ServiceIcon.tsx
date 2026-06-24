/**
 * ServiceIcon — displays a service's favicon via <img> tag.
 * Falls back to a simple default icon when no URL is available.
 */

import React from 'react';
import { CubesIcon } from '@patternfly/react-icons';
import type { ServiceEntry } from '../lib/types';
import { useIconFetcher } from '../hooks/useIconFetcher';

export interface ServiceIconProps {
  service: ServiceEntry;
  size?: 'sm' | 'md' | 'lg';
}

const DefaultIcon: React.FC<{ size: number }> = ({ size }) => (
  <CubesIcon style={{ width: size, height: size }} />
);

export const ServiceIcon: React.FC<ServiceIconProps> = ({ service, size = 'md' }) => {
  const { iconSrc } = useIconFetcher(service);
  const dim = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;

  const containerClass =
    size === 'sm'
      ? 'servicenav-card__icon servicenav-card__icon--sm'
      : 'servicenav-card__icon';

  return (
    <div className={containerClass}>
      {iconSrc ? (
        <img src={iconSrc} alt={`${service.name} icon`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      ) : (
        <DefaultIcon size={dim} />
      )}
    </div>
  );
};

export default ServiceIcon;
