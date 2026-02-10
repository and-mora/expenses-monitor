import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { CategoryItem } from '@/types/api';

type Props = {
  categories: CategoryItem[];
  onEdit?: (c: { name: string; icon?: string | null }) => void;
};

export default function CategoryList({ categories, onEdit }: Props) {
  return (
    <ul>
      {categories.map((c, idx) => {
        const name = typeof c === 'string' ? c : c.name;
        const iconName = typeof c === 'string' ? undefined : c.icon;
        // @ts-ignore dynamic lookup
        const Icon = iconName ? (LucideIcons as any)[iconName] : null;
        return (
          <li key={`${name}-${idx}`} className="flex items-center gap-3 p-2">
            <div className="w-6 h-6">
              {Icon ? <Icon size={18} aria-hidden /> : <div className="text-muted">•</div>}
            </div>
            <div className="flex-1">{name}</div>
            {onEdit && <button onClick={() => onEdit({ name, icon: iconName })}>Modifica</button>}
          </li>
        );
      })}
    </ul>
  );
}
