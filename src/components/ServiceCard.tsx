/**
 * ServiceCard component — displays a single service as a PatternFly Card.
 *
 * Shows the service icon, name, description, and resolved URL.
 * Provides edit/delete action buttons. Clicking the card opens the service in a new tab.
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Text,
  TextContent,
  TextVariants,
  Button,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { PencilAltIcon, TimesIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import type { ServiceEntry, HttpsMode } from '../lib/types';
import { resolveServiceUrl, extractPort } from '../lib/url';
import { _ } from '../lib/i18n';
import { ServiceIcon } from './ServiceIcon';

export interface ServiceCardProps {
  service: ServiceEntry;
  httpsMode?: HttpsMode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Format an ISO 8601 timestamp for display.
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, httpsMode, onEdit, onDelete }) => {
  const resolvedUrl = resolveServiceUrl(service.url, httpsMode);
  const port = extractPort(service.url);

  const handleCardClick = () => {
    if (resolvedUrl) {
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(service.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(service.id);
  };

  return (
    <Card
      className="servicenav-card"
      isClickable
      isSelectable
      onClick={handleCardClick}
      aria-label={`${service.name} — ${_('Click to open in new tab')}`}
    >
      <CardHeader
        actions={{
          actions: (
            <>
              <Button
                variant="plain"
                aria-label={_('Edit') + ' ' + service.name}
                onClick={handleEditClick}
              >
                <PencilAltIcon />
              </Button>
              <Button
                variant="plain"
                aria-label={_('Delete') + ' ' + service.name}
                onClick={handleDeleteClick}
              >
                <TimesIcon />
              </Button>
            </>
          ),
          hasNoOffset: true,
        }}
      >
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <ServiceIcon service={service} size="md" />
          </FlexItem>
          <FlexItem>
            <CardTitle>{service.name}</CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody className="servicenav-card__body">
        {service.description && (
          <TextContent>
            <Text component={TextVariants.small}>{service.description}</Text>
          </TextContent>
        )}
        <div className="servicenav-card__url">
          <ExternalLinkAltIcon />
          <span>
            {port ? `${_('Port')}: ${port}` : resolvedUrl}
          </span>
        </div>
      </CardBody>

      <CardFooter>
        <Text component={TextVariants.small} style={{ color: 'var(--pf-v5-global--Color--200)' }}>
          {_('Updated')}: {formatDate(service.updatedAt)}
        </Text>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
