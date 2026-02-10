import React, { useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { ICONS } from './iconMap';

type Props = {
  value?: string | null;
  onChange: (icon: string | null) => void;
  ariaLabel?: string;
};

export default function IconPicker({ value, onChange, ariaLabel = 'Scegli icona' }: Props) {
  const [q, setQ] = useState('');
  const list = useMemo(() => ICONS.filter(i => i.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <div>
      <label className="sr-only">{ariaLabel}</label>
      <input
        aria-label="Cerca icona"
        placeholder="Cerca..."
        value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full mb-2"
      />
      <div role="list" className="grid grid-cols-4 gap-2">
        <button
          className="flex items-center justify-center p-2 rounded border"
          onClick={() => onChange(null)}
          aria-label="Nessuna icona"
        >
          — Nessuna —
        </button>
        {list.map(name => {
          const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<unknown>>)[name];
          return (
            <button
              key={name}
              onClick={() => onChange(name)}
              aria-pressed={value === name}
              aria-label={name}
              className={`p-2 rounded border ${value === name ? 'ring-2 ring-primary' : ''}`}
            >
              {Icon ? <Icon size={20} /> : <span>{name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
