/**
 * Tests for EmptyState component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../../src/components/EmptyState';
import '@testing-library/jest-dom';

describe('EmptyState', () => {
  it('renders the no services message', () => {
    render(<EmptyState onAddService={jest.fn()} />);
    expect(
      screen.getByText(/No services configured yet/i)
    ).toBeInTheDocument();
  });

  it('renders the Add Service button', () => {
    render(<EmptyState onAddService={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /Add Service/i })
    ).toBeInTheDocument();
  });

  it('calls onAddService when button is clicked', async () => {
    const onAdd = jest.fn();
    render(<EmptyState onAddService={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: /Add Service/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('renders an icon', () => {
    const { container } = render(<EmptyState onAddService={jest.fn()} />);
    // PatternFly EmptyStateIcon renders an SVG
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
