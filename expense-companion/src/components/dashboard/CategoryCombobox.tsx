import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface CategoryComboboxProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly categories: string[];
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly 'aria-label'?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  isLoading = false,
  disabled = false,
  placeholder = "Seleziona o inserisci categoria",
  'aria-label': ariaLabel = "Category",
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const handleCreateCategory = () => {
    if (search.trim()) {
      onChange(search.trim().toLowerCase());
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "w-full justify-between overflow-hidden",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Cerca o crea categoria..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-center text-sm">
                <p className="text-muted-foreground mb-2">Nessuna categoria trovata</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleCreateCategory}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crea "{search}"
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
