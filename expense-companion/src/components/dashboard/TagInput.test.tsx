import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';
import type { Tag } from '@/types/api';

describe('TagInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Initial State', () => {
    it('should show "Add tag" button when no tags exist', () => {
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      expect(screen.getByRole('button', { name: /aggiungi tag/i })).toBeInTheDocument();
    });

    it('should not show input fields initially', () => {
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      expect(screen.queryByPlaceholderText(/chiave/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/valore/i)).not.toBeInTheDocument();
    });

    it('should display existing tags', () => {
      const tags: Tag[] = [
        { key: 'category', value: 'food' },
        { key: 'merchant', value: 'store' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      expect(screen.getByText('category')).toBeInTheDocument();
      expect(screen.getByText('merchant')).toBeInTheDocument();
    });

    it('should show tag count when tags exist', () => {
      const tags: Tag[] = [
        { key: 'category', value: 'food' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} maxTags={5} />);
      
      expect(screen.getByText('(1/5)')).toBeInTheDocument();
    });
  });

  describe('Adding Tags', () => {
    it('should show input fields when clicking Add tag button', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      
      expect(screen.getByPlaceholderText(/chiave/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/valore/i)).toBeInTheDocument();
    });

    it('should add a new tag when both inputs are filled and button is clicked', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      await user.type(screen.getByPlaceholderText(/chiave/i), 'category');
      await user.type(screen.getByPlaceholderText(/valore/i), 'food');
      
      const addButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Aggiungi')
      );
      await user.click(addButton!);
      
      expect(mockOnChange).toHaveBeenCalledWith([
        { key: 'category', value: 'food' }
      ]);
    });

    it('should add a new tag when pressing Enter', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      await user.type(screen.getByPlaceholderText(/chiave/i), 'category');
      await user.type(screen.getByPlaceholderText(/valore/i), 'food{Enter}');
      
      expect(mockOnChange).toHaveBeenCalledWith([
        { key: 'category', value: 'food' }
      ]);
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      await user.type(screen.getByPlaceholderText(/chiave/i), '  category  ');
      await user.type(screen.getByPlaceholderText(/valore/i), '  food  {Enter}');
      
      expect(mockOnChange).toHaveBeenCalledWith([
        { key: 'category', value: 'food' }
      ]);
    });

    it('should clear inputs after adding a tag', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      await user.type(screen.getByPlaceholderText(/chiave/i), 'category');
      await user.type(screen.getByPlaceholderText(/valore/i), 'food{Enter}');
      
      expect(screen.queryByPlaceholderText(/chiave/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/valore/i)).not.toBeInTheDocument();
    });

    it('should update existing tag when key already exists', async () => {
      const user = userEvent.setup();
      const existingTags: Tag[] = [
        { key: 'category', value: 'food' }
      ];
      render(<TagInput tags={existingTags} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      await user.type(screen.getByPlaceholderText(/chiave/i), 'category');
      await user.type(screen.getByPlaceholderText(/valore/i), 'drinks{Enter}');
      
      expect(mockOnChange).toHaveBeenCalledWith([
        { key: 'category', value: 'drinks' }
      ]);
    });

    it('should disable add button when inputs are empty', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      
      const addButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Aggiungi') && btn.hasAttribute('disabled')
      );
      
      expect(addButton).toBeDisabled();
    });

    it('should cancel adding when clicking X button', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      await user.type(screen.getByPlaceholderText(/chiave/i), 'category');
      
      // Find the X button (cancel button)
      const cancelButton = screen.getAllByRole('button').find(btn => 
        !btn.hasAttribute('disabled') && btn.querySelector('svg')
      )!;
      await user.click(cancelButton);
      
      expect(screen.queryByPlaceholderText(/chiave/i)).not.toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should cancel adding when pressing Escape', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      const keyInput = screen.getByPlaceholderText(/chiave/i);
      await user.type(keyInput, 'category');
      await user.keyboard('{Escape}');
      
      expect(screen.queryByPlaceholderText(/chiave/i)).not.toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Removing Tags', () => {
    it('should remove tag when clicking X button', async () => {
      const user = userEvent.setup();
      const tags: Tag[] = [
        { key: 'category', value: 'food' },
        { key: 'merchant', value: 'store' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      const removeButton = screen.getByLabelText('Remove tag category');
      await user.click(removeButton);
      
      expect(mockOnChange).toHaveBeenCalledWith([
        { key: 'merchant', value: 'store' },
      ]);
    });

    it('should remove correct tag when multiple tags exist', async () => {
      const user = userEvent.setup();
      const tags: Tag[] = [
        { key: 'tag1', value: 'value1' },
        { key: 'tag2', value: 'value2' },
        { key: 'tag3', value: 'value3' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      const removeButton = screen.getByLabelText('Remove tag tag2');
      await user.click(removeButton);
      
      expect(mockOnChange).toHaveBeenCalledWith([
        { key: 'tag1', value: 'value1' },
        { key: 'tag3', value: 'value3' },
      ]);
    });
  });

  describe('Max Tags Limit', () => {
    it('should disable add button when max tags reached', () => {
      const tags: Tag[] = [
        { key: 'tag1', value: 'value1' },
        { key: 'tag2', value: 'value2' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} maxTags={2} />);
      
      const addButton = screen.getByRole('button', { name: /aggiungi tag/i });
      expect(addButton).toBeDisabled();
    });

    it('should not add tag when max limit is reached', async () => {
      const user = userEvent.setup();
      const tags: Tag[] = [
        { key: 'tag1', value: 'value1' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} maxTags={1} />);
      
      // Try to add another tag (button should be disabled)
      const addButton = screen.getByRole('button', { name: /aggiungi tag/i });
      expect(addButton).toBeDisabled();
    });

    it('should use default maxTags of 5', () => {
      const tags: Tag[] = Array.from({ length: 3 }, (_, i) => ({
        key: `tag${i}`,
        value: `value${i}`,
      }));
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      expect(screen.getByText('(3/5)')).toBeInTheDocument();
    });

    it('should allow custom maxTags', () => {
      const tags: Tag[] = [
        { key: 'tag1', value: 'value1' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} maxTags={10} />);
      
      expect(screen.getByText('(1/10)')).toBeInTheDocument();
    });
  });

  describe('Tag Display', () => {
    it('should show tooltips with tag details on hover', async () => {
      const user = userEvent.setup();
      const tags: Tag[] = [
        { key: 'category', value: 'food' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      const tagBadge = screen.getByText('category');
      await user.hover(tagBadge);
      
      // Tooltip may be duplicated for accessibility
      const foodElements = await screen.findAllByText('food');
      expect(foodElements.length).toBeGreaterThan(0);
    });

    it('should apply different colors to tags', () => {
      const tags: Tag[] = [
        { key: 'tag1', value: 'value1' },
        { key: 'tag2', value: 'value2' },
        { key: 'tag3', value: 'value3' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      const tag1 = screen.getByText('tag1').parentElement;
      const tag2 = screen.getByText('tag2').parentElement;
      
      // Different tags should have different color classes
      expect(tag1?.className).not.toBe(tag2?.className);
    });

    it('should truncate long tag keys', () => {
      const tags: Tag[] = [
        { key: 'a'.repeat(100), value: 'value' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      const tagText = screen.getByText('a'.repeat(100));
      expect(tagText).toHaveClass('truncate');
    });
  });

  describe('Edge Cases', () => {
    it('should not add tag with only whitespace', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      await user.type(screen.getByPlaceholderText(/chiave/i), '   ');
      await user.type(screen.getByPlaceholderText(/valore/i), '   {Enter}');
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle empty tags array', () => {
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      expect(screen.getByRole('button', { name: /aggiungi tag/i })).toBeInTheDocument();
    });

    it('should handle removing last tag', async () => {
      const user = userEvent.setup();
      const tags: Tag[] = [
        { key: 'category', value: 'food' },
      ];
      render(<TagInput tags={tags} onChange={mockOnChange} />);
      
      const removeButton = screen.getByLabelText('Remove tag category');
      await user.click(removeButton);
      
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should focus key input when opening add form', async () => {
      const user = userEvent.setup();
      render(<TagInput tags={[]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole('button', { name: /aggiungi tag/i }));
      
      const keyInput = screen.getByPlaceholderText(/chiave/i);
      expect(keyInput).toHaveFocus();
    });
  });
});
