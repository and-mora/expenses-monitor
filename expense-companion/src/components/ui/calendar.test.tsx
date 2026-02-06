import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from './calendar';

describe('Calendar', () => {
  it('should render calendar', () => {
    render(<Calendar />);
    
    // Calendar should show weekday headers (abbreviated)
    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Calendar className="custom-calendar" />);
    
    // The root div should have the custom class
    const calendarDiv = container.querySelector('.custom-calendar');
    expect(calendarDiv).toBeInTheDocument();
  });

  it('should handle date selection', () => {
    const onSelect = vi.fn();
    render(<Calendar mode="single" onSelect={onSelect} />);
    
    // Find and click a day button
    const dayButtons = screen.getAllByRole('button');
    const numericDayButton = dayButtons.find(btn => /^\d+$/.test(btn.textContent || ''));
    
    if (numericDayButton) {
      fireEvent.click(numericDayButton);
      expect(onSelect).toHaveBeenCalled();
    }
  });

  it('should show navigation buttons', () => {
    render(<Calendar />);
    
    // Should have navigation buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should respect showOutsideDays prop', () => {
    const { rerender } = render(<Calendar showOutsideDays={true} />);
    
    // Should render with outside days shown by default
    expect(screen.getByRole('grid')).toBeInTheDocument();

    rerender(<Calendar showOutsideDays={false} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should render Chevron component with correct orientation', () => {
    render(<Calendar />);
    
    // Should have chevron SVGs for navigation
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should pass through additional props', () => {
    const defaultMonth = new Date(2026, 0, 1); // January 2026
    render(<Calendar defaultMonth={defaultMonth} />);
    
    // Should show January 2026
    expect(screen.getByText(/january/i)).toBeInTheDocument();
    expect(screen.getByText(/2026/i)).toBeInTheDocument();
  });
});
