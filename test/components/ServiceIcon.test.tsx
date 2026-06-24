/**
 * Tests for ServiceIcon — simple <img> based icon display.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceIcon } from '../../src/components/ServiceIcon';
import type { ServiceEntry } from '../../src/lib/types';
import '@testing-library/jest-dom';

jest.mock('../../src/hooks/useIconFetcher', () => ({
  useIconFetcher: jest.fn(),
}));

import { useIconFetcher } from '../../src/hooks/useIconFetcher';

const mockService: ServiceEntry = {
  id: 'test-1',
  name: 'Test Service',
  url: '8080',
  iconType: 'auto',
  iconUrl: null,
  description: '',
  httpsMode: 'follow',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ServiceIcon', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows image when iconSrc is available', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: 'https://example.com/favicon.ico',
      loading: false,
      error: false,
    });
    render(<ServiceIcon service={mockService} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/favicon.ico');
  });

  it('shows empty container when no icon URL', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: null,
      loading: false,
      error: false,
    });
    const { container } = render(<ServiceIcon service={mockService} />);
    expect(container.querySelector('.servicenav-card__icon')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders small size variant', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: 'https://example.com/icon.png',
      loading: false,
      error: false,
    });
    const { container } = render(<ServiceIcon service={mockService} size="sm" />);
    expect(container.querySelector('.servicenav-card__icon--sm')).toBeInTheDocument();
  });
});
