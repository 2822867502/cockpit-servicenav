/**
 * Tests for ViewToggle component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '../../src/components/ViewToggle';
import '@testing-library/jest-dom';

describe('ViewToggle', () => {
  it('renders grid and list toggle buttons', () => {
    const onChange = jest.fn();
    render(<ViewToggle viewMode="grid" onChange={onChange} />);

    expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
    expect(screen.getByLabelText('List view')).toBeInTheDocument();
  });

  it('has grid selected when viewMode is grid', () => {
    const onChange = jest.fn();
    render(<ViewToggle viewMode="grid" onChange={onChange} />);

    const gridBtn = screen.getByLabelText('Grid view');
    const listBtn = screen.getByLabelText('List view');

    expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
    expect(listBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('has list selected when viewMode is list', () => {
    const onChange = jest.fn();
    render(<ViewToggle viewMode="list" onChange={onChange} />);

    const gridBtn = screen.getByLabelText('Grid view');
    const listBtn = screen.getByLabelText('List view');

    expect(gridBtn).toHaveAttribute('aria-pressed', 'false');
    expect(listBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange when clicking list button', async () => {
    const onChange = jest.fn();
    render(<ViewToggle viewMode="grid" onChange={onChange} />);

    await userEvent.click(screen.getByLabelText('List view'));
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('calls onChange when clicking grid button', async () => {
    const onChange = jest.fn();
    render(<ViewToggle viewMode="list" onChange={onChange} />);

    await userEvent.click(screen.getByLabelText('Grid view'));
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('does not call onChange when clicking already-active mode', async () => {
    const onChange = jest.fn();
    render(<ViewToggle viewMode="grid" onChange={onChange} />);

    await userEvent.click(screen.getByLabelText('Grid view'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
