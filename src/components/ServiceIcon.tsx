/**
 * ServiceIcon component — displays a service's icon with loading/fallback states.
 *
 * Uses the useIconFetcher hook to handle auto-fetch, custom URL, and default modes.
 * Shows a spinner while loading and a default SVG icon on error.
 */

import React from 'react';
import { Spinner } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import type { ServiceEntry } from '../lib/types';
import { useIconFetcher } from '../hooks/useIconFetcher';

export interface ServiceIconProps {
  /** The service to display an icon for */
  service: ServiceEntry;
  /** Icon size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Default fallback icon SVG — a cube/box shape
 * used when no custom icon is available or loading fails.
 */
const DefaultIcon: React.FC<{ size?: string }> = ({ size = 'md' }) => {
  const dimensions = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;
  return (
    <CubesIcon
      style={{ width: dimensions, height: dimensions }}
      aria-label="Default service icon"
    />
  );
};

export const ServiceIcon: React.FC<ServiceIconProps> = ({ service, size = 'md' }) => {
  const { iconSrc, loading, error } = useIconFetcher(service);

  const containerClass =
    size === 'sm'
      ? 'servicenav-card__icon servicenav-card__icon--sm'
      : 'servicenav-card__icon';

  // Loading state
  if (loading) {
    return (
      <div className={containerClass} aria-label={`Loading icon for ${service.name}`}>
        <div className="servicenav-icon__loading">
          <Spinner size={size === 'sm' ? 'sm' : 'md'} aria-label="Loading icon" />
        </div>
      </div>
    );
  }

  // Render fetched/custom icon
  if (iconSrc && !error) {
    return (
      <div className={containerClass} aria-label={`Icon for ${service.name}`}>
        <img
          src={iconSrc}
          alt={`${service.name} icon`}
          onError={() => {
            // If the preloaded image fails to render, the hook already handles this
          }}
        />
      </div>
    );
  }

  // Default/fallback icon
  return (
    <div className={containerClass} aria-label={`Default icon for ${service.name}`}>
      <div className="servicenav-icon__fallback">
        <DefaultIcon size={size} />
      </div>
    </div>
  );
};

export default ServiceIcon;
