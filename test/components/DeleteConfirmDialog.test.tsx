/**
 * Tests for DeleteConfirmDialog component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from '../../src/components/DeleteConfirmDialog';
import type { ServiceEntry } from '../../src/lib/types';
import '@testing-library/jest-dom';

const mockService: ServiceEntry = {
  id: 'test-1',
  name: 'Grafana Monitoring',
  url: '3000',
  iconType: 'auto',
  iconUrl: null,
  description: 'Dashboards',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DeleteConfirmDialog', () => {
  it('shows the service name in the confirmation message', () => {
    render(
      <DeleteConfirmDialog
        service={mockService}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/Grafana Monitoring/)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it('calls onConfirm when Delete button is clicked', async () => {
    const onConfirm = jest.fn();
    render(
      <DeleteConfirmDialog
        service={mockService}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <DeleteConfirmDialog
        service={mockService}
        onConfirm={jest.fn()}
        onClose={onClose}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays a warning about irreversible action', () => {
    render(
      <DeleteConfirmDialog
        service={mockService}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByText(/This action cannot be undone/i)
    ).toBeInTheDocument();
  });
});
