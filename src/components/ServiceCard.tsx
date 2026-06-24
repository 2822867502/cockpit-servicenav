/**
 * ServiceCard — displays a service with icon, name, description, and URL link.
 * Only the URL link row and edit/delete buttons are clickable.
 */

import React from 'react';
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle,
  Text, TextContent, TextVariants, Button, Flex, FlexItem,
} from '@patternfly/react-core';
import { PencilAltIcon, TimesIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import type { ServiceEntry } from '../lib/types';
import { resolveServiceUrl, extractPort } from '../lib/url';
import { _ } from '../lib/i18n';
import { ServiceIcon } from './ServiceIcon';

export interface ServiceCardProps {
  service: ServiceEntry;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete }) => {
  const resolvedUrl = resolveServiceUrl(service.url, service.httpsMode);
  const port = extractPort(service.url);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resolvedUrl) window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="servicenav-card">
      <CardHeader
        actions={{
          actions: (
            <>
              <Button variant="plain" aria-label={_('Edit') + ' ' + service.name}
                onClick={(e: any) => { e.stopPropagation(); onEdit(service.id); }}>
                <PencilAltIcon />
              </Button>
              <Button variant="plain" aria-label={_('Delete') + ' ' + service.name}
                onClick={(e: any) => { e.stopPropagation(); onDelete(service.id); }}>
                <TimesIcon />
              </Button>
            </>
          ),
          hasNoOffset: true,
        }}
      >
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
          <FlexItem><ServiceIcon service={service} size="md" /></FlexItem>
          <FlexItem>
            <CardTitle style={{ cursor: 'pointer' }} onClick={handleOpen}>{service.name}</CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody className="servicenav-card__body">
        {service.description && (
          <TextContent>
            <Text component={TextVariants.small}>{service.description}</Text>
          </TextContent>
        )}
        <div className="servicenav-card__url" onClick={handleOpen} role="link" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleOpen(e as any); }}>
          <ExternalLinkAltIcon />
          <span>{port ? `${_('Port')}: ${port}` : resolvedUrl}</span>
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
