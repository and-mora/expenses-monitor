import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';

describe('MobileBottomNav', () => {
  const renderWithRouter = (initialRoute = '/') => {
    window.history.pushState({}, 'Test page', initialRoute);
    return render(
      <BrowserRouter>
        <MobileBottomNav />
      </BrowserRouter>
    );
  };

  it('renders all navigation items', () => {
    renderWithRouter();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('marks Dashboard as active when on home route', () => {
    renderWithRouter('/');
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('text-primary');
  });

  it('marks Transactions as active when on transactions route', () => {
    renderWithRouter('/transactions');
    
    const transactionsLink = screen.getByText('Transactions').closest('a');
    expect(transactionsLink).toHaveClass('text-primary');
  });

  it('marks Settings as active when on settings route', () => {
    renderWithRouter('/settings');
    
    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveClass('text-primary');
  });

  it('has correct navigation links', () => {
    renderWithRouter();
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const transactionsLink = screen.getByText('Transactions').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');
    
    expect(dashboardLink).toHaveAttribute('href', '/');
    expect(transactionsLink).toHaveAttribute('href', '/transactions');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('is hidden on desktop and visible on mobile', () => {
    const { container } = renderWithRouter();
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('md:hidden');
  });

  it('is fixed at the bottom of the screen', () => {
    const { container } = renderWithRouter();
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'bottom-0');
  });
});
