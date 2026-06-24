/**
 * Tests for ServiceCard component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCard } from '../../src/components/ServiceCard';
import type { ServiceEntry } from '../../src/lib/types';
import '@testing-library/jest-dom';

// Mock ServiceIcon to simplify testing
jest.mock('../../src/components/ServiceIcon', () => ({
  ServiceIcon: () => <div data-testid="mock-icon">Icon</div>,
}));

// Mock window.open
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

const mockService: ServiceEntry = {
  id: 'test-1',
  name: 'Grafana',
  url: '3000',
  iconType: 'auto',
  iconUrl: null,
  description: 'Monitoring dashboards',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('ServiceCard', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear();
  });

  it('renders service name', () => {
    render(
      <ServiceCard service={mockService} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByText('Grafana')).toBeInTheDocument();
  });

  it('renders service description', () => {
    render(
      <ServiceCard service={mockService} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByText('Monitoring dashboards')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(
      <ServiceCard service={mockService} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('shows port number when service uses relative port', () => {
    render(
      <ServiceCard service={mockService} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByText(/Port: 3000/i)).toBeInTheDocument();
  });

  it('opens service URL in new tab on card click', async () => {
    render(
      <ServiceCard service={mockService} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    // Click the card
    await userEvent.click(screen.getByText('Grafana'));
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('3000'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = jest.fn();
    render(
      <ServiceCard service={mockService} onEdit={onEdit} onDelete={jest.fn()} />
    );
    await userEvent.click(screen.getByLabelText(/Edit Grafana/i));
    expect(onEdit).toHaveBeenCalledWith('test-1');
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = jest.fn();
    render(
      <ServiceCard service={mockService} onEdit={jest.fn()} onDelete={onDelete} />
    );
    await userEvent.click(screen.getByLabelText(/Delete Grafana/i));
    expect(onDelete).toHaveBeenCalledWith('test-1');
  });

  it('displays last updated date', () => {
    render(
      <ServiceCard service={mockService} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByText(/Updated:/i)).toBeInTheDocument();
  });

  it('does not show description text if empty', () => {
    const svc = { ...mockService, description: '' };
    render(
      <ServiceCard service={svc} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    // The description div should have no text content (but URL info is still shown)
    expect(screen.queryByText('Monitoring dashboards')).not.toBeInTheDocument();
  });
});
