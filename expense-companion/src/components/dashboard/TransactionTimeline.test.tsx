import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionTimeline } from './TransactionTimeline';
import type { Payment } from '@/types/api';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPayments: Payment[] = [
  {
    id: '1',
    merchantName: 'Supermarket',
    amountInCents: -5000,
    category: 'food',
    accountingDate: '2026-01-15T10:00:00',
    description: 'Weekly groceries',
    wallet: 'Main Account',
    tags: [{ key: 'type', value: 'groceries' }],
  },
  {
    id: '2',
    merchantName: 'Netflix',
    amountInCents: -1299,
    category: 'entertainment',
    accountingDate: '2026-01-15T14:00:00',
    description: 'Monthly subscription',
    wallet: 'Main Account',
  },
  {
    id: '3',
    merchantName: 'Salary',
    amountInCents: 350000,
    category: 'income',
    accountingDate: '2026-01-14T09:00:00',
    description: 'Monthly salary',
    wallet: 'Main Account',
  },
  {
    id: '4',
    merchantName: 'Gas Station',
    amountInCents: -4500,
    category: 'transport',
    accountingDate: '2026-01-13T08:00:00',
    wallet: 'Cash',
  },
  {
    id: '5',
    merchantName: 'Pharmacy',
    amountInCents: -2350,
    category: 'health',
    accountingDate: '2026-01-12T16:00:00',
    wallet: 'Main Account',
  },
  {
    id: '6',
    merchantName: 'Electricity Bill',
    amountInCents: -8500,
    category: 'utilities',
    accountingDate: '2026-01-11T10:00:00',
    wallet: 'Main Account',
  },
  {
    id: '7',
    merchantName: 'Clothing Store',
    amountInCents: -12000,
    category: 'shopping',
    accountingDate: '2026-01-10T15:00:00',
    wallet: 'Main Account',
  },
  {
    id: '8',
    merchantName: 'Other Expense',
    amountInCents: -1000,
    category: 'miscellaneous',
    accountingDate: '2026-01-09T12:00:00',
    wallet: 'Main Account',
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TransactionTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render payments grouped by date', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      // Check that merchant names are displayed
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    it('should display formatted dates as section headers', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      // Dates should be formatted
      expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
      expect(screen.getByText('Jan 14, 2026')).toBeInTheDocument();
    });

    it('should display daily totals in badges', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      // Jan 15 has -5000 + -1299 = -6299 cents
      expect(screen.getByText('-€62.99')).toBeInTheDocument();
    });

    it('should render empty when no payments', () => {
      const { container } = renderWithRouter(<TransactionTimeline payments={[]} />);
      expect(container.querySelector('.space-y-6')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithRouter(
        <TransactionTimeline payments={mockPayments} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should show category labels capitalized', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);
      
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
      expect(screen.getByText('Income')).toBeInTheDocument();
    });

    it('should display amounts with correct styling for income/expense', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);
      
      // Income should show positive with text-income class (p element, not badge)
      const incomeAmounts = screen.getAllByText('+€3,500.00');
      // Find the one with text-income class (not the badge)
      const incomeAmount = incomeAmounts.find(el => el.classList.contains('text-income'));
      expect(incomeAmount).toBeDefined();
      expect(incomeAmount).toHaveClass('text-income');
      
      // Expense should show negative
      const expenseAmounts = screen.getAllByText('-€50.00');
      const expenseAmount = expenseAmounts.find(el => el.classList.contains('text-expense'));
      expect(expenseAmount).toBeDefined();
      expect(expenseAmount).toHaveClass('text-expense');
    });

    it('should render different category icons', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);
      
      // Icons are rendered (checking for lucide icons in DOM)
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle unknown categories with default icon', () => {
      const unknownCategoryPayment: Payment[] = [{
        id: '99',
        merchantName: 'Unknown',
        amountInCents: -100,
        category: 'unknowncategory',
        accountingDate: '2026-01-20T10:00:00',
        wallet: 'Main Account',
      }];
      
      renderWithRouter(<TransactionTimeline payments={unknownCategoryPayment} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to payment detail when clicking a transaction', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      const supermarketItem = screen.getByText('Supermarket').closest('div[class*="cursor-pointer"]');
      fireEvent.click(supermarketItem!);

      expect(mockNavigate).toHaveBeenCalledWith('/transactions/1', { 
        state: { payment: mockPayments[0] } 
      });
    });
  });

  describe('Actions', () => {
    it('should not show action buttons when no handlers provided', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('should show edit button when onEdit is provided', () => {
      const mockOnEdit = vi.fn();
      renderWithRouter(
        <TransactionTimeline 
          payments={mockPayments} 
          onEdit={mockOnEdit}
        />
      );

      // When onEdit is provided, edit buttons should exist in the DOM
      // The Edit2 icon renders with classes like 'lucide lucide-square-pen'
      const allSvgs = document.querySelectorAll('svg');
      const editButtonsExist = Array.from(allSvgs).some(svg => {
        const parent = svg.closest('button');
        // Check if it's inside the action buttons area (not the chevron icons)
        return parent && parent.classList.contains('rounded-full');
      });
      expect(editButtonsExist).toBe(true);
    });

    it('should show delete button when onDelete is provided', () => {
      const mockOnDelete = vi.fn();
      renderWithRouter(
        <TransactionTimeline 
          payments={mockPayments} 
          onDelete={mockOnDelete}
        />
      );

      // Delete buttons exist
      const deleteButtons = document.querySelectorAll('button svg.lucide-trash-2');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should disable action buttons when isDeleting is true', () => {
      const mockOnDelete = vi.fn();
      const mockOnEdit = vi.fn();
      renderWithRouter(
        <TransactionTimeline 
          payments={mockPayments} 
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
          isDeleting={true}
        />
      );

      const deleteButtons = document.querySelectorAll('button:disabled');
      // All action buttons should be disabled
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Touch/Swipe Gestures', () => {
    const getTouchEvent = (x: number, y: number) => ({
      touches: [{ clientX: x, clientY: y }],
    });

    it('should handle touch start event', () => {
      const mockOnEdit = vi.fn();
      renderWithRouter(
        <TransactionTimeline 
          payments={mockPayments} 
          onEdit={mockOnEdit}
        />
      );

      const item = screen.getByText('Supermarket').closest('div[class*="cursor-pointer"]');
      fireEvent.touchStart(item!, getTouchEvent(100, 50));
      // No error should occur
    });

    it('should handle touch move event for horizontal swipe', () => {
      const mockOnEdit = vi.fn();
      renderWithRouter(
        <TransactionTimeline 
          payments={mockPayments} 
          onEdit={mockOnEdit}
        />
      );

      const item = screen.getByText('Supermarket').closest('div[class*="cursor-pointer"]');
      
      fireEvent.touchStart(item!, getTouchEvent(200, 50));
      fireEvent.touchMove(item!, getTouchEvent(100, 50)); // Swipe left 100px
      fireEvent.touchEnd(item!);
    });

    it('should ignore vertical swipes', () => {
      const mockOnEdit = vi.fn();
      renderWithRouter(
        <TransactionTimeline 
          payments={mockPayments} 
          onEdit={mockOnEdit}
        />
      );

      const item = screen.getByText('Supermarket').closest('div[class*="cursor-pointer"]');
      
      fireEvent.touchStart(item!, getTouchEvent(100, 50));
      fireEvent.touchMove(item!, getTouchEvent(100, 150)); // Vertical scroll
      fireEvent.touchEnd(item!);
      
      // Should not trigger swipe
    });

    it('should reset swipe on touch end if below threshold', () => {
      const mockOnEdit = vi.fn();
      renderWithRouter(
        <TransactionTimeline 
          payments={mockPayments} 
          onEdit={mockOnEdit}
        />
      );

      const item = screen.getByText('Supermarket').closest('div[class*="cursor-pointer"]');
      
      fireEvent.touchStart(item!, getTouchEvent(100, 50));
      fireEvent.touchMove(item!, getTouchEvent(70, 50)); // Small swipe
      fireEvent.touchEnd(item!);
    });

    it('should not initiate swipe when no handlers provided', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      const item = screen.getByText('Supermarket').closest('div[class*="cursor-pointer"]');
      
      fireEvent.touchStart(item!, getTouchEvent(100, 50));
      fireEvent.touchMove(item!, getTouchEvent(0, 50));
      fireEvent.touchEnd(item!);
      
      // Click should still navigate
      fireEvent.click(item!);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Grouping Logic', () => {
    it('should group payments from same date together', () => {
      const sameDatePayments: Payment[] = [
        {
          id: '1',
          merchantName: 'Morning Coffee',
          amountInCents: -500,
          category: 'food',
          accountingDate: '2026-02-01T08:00:00',
          wallet: 'Main Account',
        },
        {
          id: '2',
          merchantName: 'Lunch',
          amountInCents: -1500,
          category: 'food',
          accountingDate: '2026-02-01T12:00:00',
          wallet: 'Main Account',
        },
        {
          id: '3',
          merchantName: 'Dinner',
          amountInCents: -2000,
          category: 'food',
          accountingDate: '2026-02-01T19:00:00',
          wallet: 'Main Account',
        },
      ];

      renderWithRouter(<TransactionTimeline payments={sameDatePayments} />);

      // Should only have one date header
      const dateHeaders = screen.getAllByText('Feb 1, 2026');
      expect(dateHeaders).toHaveLength(1);

      // Total should be sum of all: -500 + -1500 + -2000 = -4000
      expect(screen.getByText('-€40.00')).toBeInTheDocument();
    });

    it('should sort groups by date descending (newest first)', () => {
      const { container } = renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      const sections = container.querySelectorAll('section');
      const firstSectionDate = sections[0]?.querySelector('h3')?.textContent;
      const lastSectionDate = sections[sections.length - 1]?.querySelector('h3')?.textContent;

      // First should be newer
      expect(firstSectionDate).toBe('Jan 15, 2026');
      expect(lastSectionDate).toBe('Jan 9, 2026');
    });

    it('should sort items within a group by time descending', () => {
      renderWithRouter(<TransactionTimeline payments={mockPayments} />);

      // On Jan 15, Netflix (14:00) should appear before Supermarket (10:00)
      const allText = document.body.textContent;
      const netflixIndex = allText?.indexOf('Netflix') ?? -1;
      const supermarketIndex = allText?.indexOf('Supermarket') ?? -1;

      expect(netflixIndex).toBeLessThan(supermarketIndex);
    });
  });
});
