/**
 * Tests for ServiceIcon component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceIcon } from '../../src/components/ServiceIcon';
import type { ServiceEntry } from '../../src/lib/types';
import '@testing-library/jest-dom';

// Mock the useIconFetcher hook
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
  description: 'A test service',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ServiceIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when icon is loading', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: null,
      loading: true,
      error: false,
    });

    render(<ServiceIcon service={mockService} />);
    // Use getByRole to find the progressbar (spinner)
    expect(screen.getByRole('progressbar', { name: /loading icon/i })).toBeInTheDocument();
  });

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

  it('shows default icon when iconSrc is null and not loading', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: null,
      loading: false,
      error: false,
    });

    const { container } = render(<ServiceIcon service={mockService} />);
    // Should render the default SVG icon (CubesIcon)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows default icon on fetch error', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: null,
      loading: false,
      error: true,
    });

    const { container } = render(<ServiceIcon service={mockService} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders small size variant', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: null,
      loading: false,
      error: false,
    });

    const { container } = render(<ServiceIcon service={mockService} size="sm" />);
    const iconWrapper = container.querySelector('.servicenav-card__icon--sm');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('passes service name in aria labels', () => {
    (useIconFetcher as jest.Mock).mockReturnValue({
      iconSrc: null,
      loading: false,
      error: false,
    });

    render(<ServiceIcon service={mockService} />);
    // Check the container has the right aria-label
    const label = screen.getByLabelText(/icon for test service/i);
    expect(label).toBeInTheDocument();
  });
});
