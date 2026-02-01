import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentTags } from './PaymentTags';
import type { Tag } from '@/types/api';
import userEvent from '@testing-library/user-event';

describe('PaymentTags', () => {
  const mockTags: Tag[] = [
    { key: 'category', value: 'food' },
    { key: 'merchant', value: 'Grocery Store' },
    { key: 'location', value: 'Milan' },
  ];

  describe('Rendering', () => {
    it('should render nothing when tags array is empty', () => {
      const { container } = render(<PaymentTags tags={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when tags is undefined', () => {
      const { container } = render(<PaymentTags tags={undefined as unknown as Tag[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render all tags when count is less than maxVisible', () => {
      render(<PaymentTags tags={mockTags.slice(0, 2)} maxVisible={3} />);
      
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.getByText('merchant')).toBeInTheDocument();
    });

    it('should render only maxVisible tags when count exceeds maxVisible', () => {
      render(<PaymentTags tags={mockTags} maxVisible={2} />);
      
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.getByText('merchant')).toBeInTheDocument();
      expect(screen.queryByText('location')).not.toBeInTheDocument();
    });

    it('should show +N badge when there are hidden tags', () => {
      render(<PaymentTags tags={mockTags} maxVisible={1} />);
      
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should use default maxVisible of 3', () => {
      const manyTags: Tag[] = [
        { key: 'tag1', value: 'value1' },
        { key: 'tag2', value: 'value2' },
        { key: 'tag3', value: 'value3' },
        { key: 'tag4', value: 'value4' },
      ];
      render(<PaymentTags tags={manyTags} />);
      
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PaymentTags tags={mockTags.slice(0, 1)} className="custom-class" />
      );
      
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Tooltip Interactions', () => {
    it('should show full tag description on hover', async () => {
      const user = userEvent.setup();
      render(<PaymentTags tags={[mockTags[0]]} />);
      
      const tagBadge = screen.getByText('category');
      await user.hover(tagBadge);
      
      // Tooltip should show full description (may be duplicated for accessibility)
      const tooltips = await screen.findAllByText('category: food');
      expect(tooltips.length).toBeGreaterThan(0);
    });

    it('should show hidden tags in tooltip when hovering +N badge', async () => {
      const user = userEvent.setup();
      render(<PaymentTags tags={mockTags} maxVisible={1} />);
      
      const plusBadge = screen.getByText('+2');
      await user.hover(plusBadge);
      
      // Tooltip should show hidden tags (may be duplicated for accessibility)
      const altriTag = await screen.findAllByText('Altri tag:');
      expect(altriTag.length).toBeGreaterThan(0);
      
      const merchantElements = await screen.findAllByText((content, element) => {
        return element?.textContent?.includes('merchant:') ?? false;
      });
      expect(merchantElements.length).toBeGreaterThan(0);
      
      const locationElements = await screen.findAllByText((content, element) => {
        return element?.textContent?.includes('location:') ?? false;
      });
      expect(locationElements.length).toBeGreaterThan(0);
    });
  });

  describe('Color Assignment', () => {
    it('should assign consistent colors based on tag key', () => {
      const { rerender } = render(<PaymentTags tags={[{ key: 'category', value: 'food' }]} />);
      const firstBadge = screen.getByText('category');
      const firstClasses = firstBadge.className;
      
      rerender(<PaymentTags tags={[{ key: 'category', value: 'different' }]} />);
      const secondBadge = screen.getByText('category');
      const secondClasses = secondBadge.className;
      
      // Same key should get same color classes
      expect(firstClasses).toBe(secondClasses);
    });

    it('should assign different colors for different keys', () => {
      render(<PaymentTags tags={[
        { key: 'category', value: 'food' },
        { key: 'merchant', value: 'store' },
      ]} />);
      
      const categoryBadge = screen.getByText('category');
      const merchantBadge = screen.getByText('merchant');
      
      // Different keys should have different styling
      expect(categoryBadge.className).not.toBe(merchantBadge.className);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tags with empty values', () => {
      const tagsWithEmpty: Tag[] = [
        { key: 'category', value: '' },
        { key: 'merchant', value: 'Store' },
      ];
      render(<PaymentTags tags={tagsWithEmpty} />);
      
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.getByText('merchant')).toBeInTheDocument();
    });

    it('should handle tags with special characters in keys', () => {
      const specialTags: Tag[] = [
        { key: 'tag-with-dash', value: 'value1' },
        { key: 'tag_with_underscore', value: 'value2' },
      ];
      render(<PaymentTags tags={specialTags} />);
      
      expect(screen.getByText('tag-with-dash')).toBeInTheDocument();
      expect(screen.getByText('tag_with_underscore')).toBeInTheDocument();
    });

    it('should handle tags with very long values', () => {
      const longTag: Tag[] = [
        { key: 'description', value: 'A'.repeat(100) },
      ];
      render(<PaymentTags tags={longTag} />);
      
      expect(screen.getByText('description')).toBeInTheDocument();
    });

    it('should handle single tag', () => {
      render(<PaymentTags tags={[mockTags[0]]} />);
      
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it('should handle maxVisible of 0', () => {
      render(<PaymentTags tags={mockTags} maxVisible={0} />);
      
      // Should show +N badge for all tags
      expect(screen.getByText('+3')).toBeInTheDocument();
      expect(screen.queryByText('category')).not.toBeInTheDocument();
    });

    it('should handle very large maxVisible', () => {
      render(<PaymentTags tags={mockTags} maxVisible={100} />);
      
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.getByText('merchant')).toBeInTheDocument();
      expect(screen.getByText('location')).toBeInTheDocument();
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render badges with proper interactive elements', () => {
      render(<PaymentTags tags={mockTags} maxVisible={2} />);
      
      // Check that badges are rendered
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.getByText('merchant')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });
});
