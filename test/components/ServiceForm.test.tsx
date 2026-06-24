/**
 * Tests for ServiceForm component using role-based queries
 * to avoid PatternFly label duplication issues.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceForm } from '../../src/components/ServiceForm';
import type { ServiceEntry } from '../../src/lib/types';
import '@testing-library/jest-dom';

const mockService: ServiceEntry = {
  id: 'test-1',
  name: 'Grafana',
  url: '3000',
  iconType: 'auto',
  iconUrl: null,
  description: 'Monitoring dashboards',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ServiceForm — Add Mode', () => {
  it('renders with "Add Service" title', () => {
    render(<ServiceForm onSave={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText('Add Service')).toBeInTheDocument();
  });

  it('has empty name field initially', () => {
    render(<ServiceForm onSave={jest.fn()} onClose={jest.fn()} />);
    const nameInput = screen.getByRole('textbox', { name: /^Name/ });
    expect(nameInput).toHaveValue('');
  });

  it('has auto icon type selected by default', () => {
    render(<ServiceForm onSave={jest.fn()} onClose={jest.fn()} />);
    const autoRadio = screen.getByRole('radio', { name: /Auto-fetch favicon/i });
    expect(autoRadio).toBeChecked();
  });

  it('does not show icon URL input in auto mode', () => {
    render(<ServiceForm onSave={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByRole('textbox', { name: /Icon URL/ })).not.toBeInTheDocument();
  });

  it('shows icon URL input when custom URL icon type is selected', async () => {
    render(<ServiceForm onSave={jest.fn()} onClose={jest.fn()} />);
    await userEvent.click(screen.getByRole('radio', { name: /Custom icon URL/ }));
    expect(screen.getByRole('textbox', { name: /Icon URL/ })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = jest.fn();
    render(<ServiceForm onSave={jest.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation errors when saving empty form', async () => {
    const onSave = jest.fn();
    render(<ServiceForm onSave={onSave} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));
    // Validation should prevent onSave from being called
    expect(onSave).not.toHaveBeenCalled();
    // Name field should show error state - check the input has aria-invalid
    await waitFor(() => {
      const nameInput = screen.getByRole('textbox', { name: /^Name/ });
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('calls onSave with form data when valid', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<ServiceForm onSave={onSave} onClose={jest.fn()} />);

    await userEvent.type(screen.getByRole('textbox', { name: /^Name/ }), 'Grafana');
    await userEvent.type(
      screen.getByRole('textbox', { name: /URL or Port/i }),
      'https://grafana.example.com:3000'
    );

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Grafana',
          url: 'https://grafana.example.com:3000',
          iconType: 'auto',
        })
      );
    });
  });

  it('shows live URL preview for relative port', async () => {
    render(<ServiceForm onSave={jest.fn()} onClose={jest.fn()} />);

    await userEvent.type(
      screen.getByRole('textbox', { name: /URL or Port/i }),
      '8080'
    );

    await waitFor(() => {
      expect(screen.getByText(/Resolved URL/i)).toBeInTheDocument();
      // Should show the resolved URL with test host
      expect(screen.getByText(/test-host:8080/)).toBeInTheDocument();
    });
  });

  it('shows character count for description', async () => {
    render(<ServiceForm onSave={jest.fn()} onClose={jest.fn()} />);

    const descInput = screen.getByRole('textbox', { name: /Description/i });
    await userEvent.type(descInput, 'Test');

    // The character count shows "4/500" somewhere in the form
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });
});

describe('ServiceForm — Edit Mode', () => {
  it('renders with "Edit Service" title', () => {
    render(
      <ServiceForm service={mockService} onSave={jest.fn()} onClose={jest.fn()} />
    );
    expect(screen.getByText('Edit Service')).toBeInTheDocument();
  });

  it('pre-populates name field from existing service', () => {
    render(
      <ServiceForm service={mockService} onSave={jest.fn()} onClose={jest.fn()} />
    );

    const nameInput = screen.getByRole('textbox', { name: /^Name/ }) as HTMLInputElement;
    expect(nameInput.value).toBe('Grafana');
  });

  it('pre-populates URL field from existing service', () => {
    render(
      <ServiceForm service={mockService} onSave={jest.fn()} onClose={jest.fn()} />
    );

    const urlInput = screen.getByRole('textbox', { name: /URL or Port/i }) as HTMLInputElement;
    expect(urlInput.value).toBe('3000');
  });

  it('calls onSave with updated data', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <ServiceForm service={mockService} onSave={onSave} onClose={jest.fn()} />
    );

    const nameInput = screen.getByRole('textbox', { name: /^Name/ });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Grafana');

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Grafana',
        })
      );
    });
  });
});
