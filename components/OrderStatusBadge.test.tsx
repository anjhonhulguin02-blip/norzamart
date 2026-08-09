import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderStatusBadge from './OrderStatusBadge';

describe('OrderStatusBadge', () => {
  it('renders a human-readable label for a known status', () => {
    render(<OrderStatusBadge status="out_for_delivery" />);
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
  });

  it('renders the delivered label', () => {
    render(<OrderStatusBadge status="delivered" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('falls back to the pending style for an unrecognized status', () => {
    render(<OrderStatusBadge status="not_a_real_status" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
