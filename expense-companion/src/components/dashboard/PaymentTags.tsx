import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/api';

// Colori distintivi per i tag basati sull'hash della chiave
const tagColorVariants = [
  'bg-tag-blue/15 text-tag-blue border-tag-blue/30',
  'bg-tag-purple/15 text-tag-purple border-tag-purple/30',
  'bg-tag-teal/15 text-tag-teal border-tag-teal/30',
  'bg-tag-amber/15 text-tag-amber border-tag-amber/30',
  'bg-tag-rose/15 text-tag-rose border-tag-rose/30',
  'bg-tag-emerald/15 text-tag-emerald border-tag-emerald/30',
  'bg-tag-indigo/15 text-tag-indigo border-tag-indigo/30',
  'bg-tag-orange/15 text-tag-orange border-tag-orange/30',
];

function getTagColorIndex(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % tagColorVariants.length;
}

interface PaymentTagsProps {
  tags: Tag[];
  maxVisible?: number;
  className?: string;
  variant?: 'compact' | 'full'; // compact: show only key, full: show key: value
}

export function PaymentTags({ tags, maxVisible = 3, className, variant = 'compact' }: PaymentTagsProps) {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenTags = tags.slice(maxVisible);
  const hasHiddenTags = hiddenTags.length > 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center gap-1 flex-wrap", className)}>
        {visibleTags.map((tag) => (
          <TagBadge key={`${tag.key}-${tag.value}`} tag={tag} variant={variant} />
        ))}
        
        {hasHiddenTags && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 cursor-default bg-muted/50 hover:bg-muted"
                >
                  +{hiddenTags.length}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px]">
              <div className="space-y-1.5">
                <p className="font-medium text-xs">Altri tag:</p>
                <div className="flex flex-wrap gap-1">
                  {hiddenTags.map((tag) => (
                    <span 
                      key={`${tag.key}-${tag.value}`}
                      className="text-xs"
                    >
                      <span className="font-medium">{tag.key}:</span> {tag.value}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

interface TagBadgeProps {
  tag: Tag;
  variant?: 'compact' | 'full';
}

function TagBadge({ tag, variant = 'compact' }: TagBadgeProps) {
  const colorClass = tagColorVariants[getTagColorIndex(tag.key)];
  const displayText = variant === 'full' ? `${tag.key}: ${tag.value}` : tag.key;
  const fullDescription = `${tag.key}: ${tag.value}`;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 cursor-default font-medium border transition-colors",
              variant === 'full' && "h-auto py-0.5",
              colorClass
            )}
          >
            {displayText}
          </Badge>
        </div>
      </TooltipTrigger>
      {variant === 'compact' && (
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs wrap-break-word">{fullDescription}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
