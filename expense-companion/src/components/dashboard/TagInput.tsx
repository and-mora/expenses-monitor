import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Tag } from '@/types/api';

const tagColorVariants = [
  'bg-tag-blue/20 text-tag-blue border-tag-blue/30',
  'bg-tag-green/20 text-tag-green border-tag-green/30',
  'bg-tag-purple/20 text-tag-purple border-tag-purple/30',
  'bg-tag-orange/20 text-tag-orange border-tag-orange/30',
  'bg-tag-pink/20 text-tag-pink border-tag-pink/30',
];

interface TagInputProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  maxTags?: number;
}

export function TagInput({ tags, onChange, maxTags = 5 }: TagInputProps) {
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  console.log('[TagInput] Render - current tags:', tags);

  const handleAddTag = () => {
    if (keyInput.trim() && valueInput.trim() && tags.length < maxTags) {
      const newTag: Tag = {
        key: keyInput.trim(),
        value: valueInput.trim(),
      };
      
      console.log('[TagInput] Adding tag:', newTag);
      console.log('[TagInput] Current tags before add:', tags);
      
      // Check if tag with same key already exists
      const existingIndex = tags.findIndex(t => t.key === newTag.key);
      if (existingIndex >= 0) {
        // Update existing tag
        const updatedTags = [...tags];
        updatedTags[existingIndex] = newTag;
        console.log('[TagInput] Updated tags (replaced existing):', updatedTags);
        onChange(updatedTags);
      } else {
        const updatedTags = [...tags, newTag];
        console.log('[TagInput] Updated tags (new tag):', updatedTags);
        onChange(updatedTags);
      }
      
      setKeyInput('');
      setValueInput('');
      setIsAdding(false);
    }
  };

  const handleRemoveTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setKeyInput('');
      setValueInput('');
    }
  };

  const getTagColor = (index: number) => {
    return tagColorVariants[index % tagColorVariants.length];
  };

  return (
    <div className="space-y-2">
      {/* Existing Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <TooltipProvider>
            {tags.map((tag, index) => (
              <Tooltip key={`${tag.key}-${index}`}>
                <TooltipTrigger asChild>
                  <div>
                    <Badge
                      variant="outline"
                      className={`${getTagColor(index)} text-xs font-medium px-2 py-0.5 cursor-default group`}
                    >
                      <span className="truncate max-w-[80px]">{tag.key}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                        aria-label={`Remove tag ${tag.key}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="font-medium">{tag.key}</p>
                  <p className="text-muted-foreground text-xs">{tag.value}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      )}

      {/* Add Tag Form */}
      {isAdding ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="Chiave (es. progetto)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="flex-1 space-y-1">
            <Input
              placeholder="Valore (es. vacanze)"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddTag}
            disabled={!keyInput.trim() || !valueInput.trim()}
            className="h-8"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setKeyInput('');
              setValueInput('');
            }}
            className="h-8"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={tags.length >= maxTags}
          className="text-xs h-7 gap-1"
        >
          <Plus className="h-3 w-3" />
          Aggiungi tag
          {tags.length > 0 && (
            <span className="text-muted-foreground ml-1">
              ({tags.length}/{maxTags})
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
