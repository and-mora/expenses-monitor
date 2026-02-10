import React, { useState } from 'react';
import { PaymentCreateWithIcon } from '@/types/api';
import IconPicker from '../icons/IconPicker';

type Props = {
  initial?: Partial<PaymentCreateWithIcon>;
  onSave: (c: Partial<PaymentCreateWithIcon>) => void;
  onCancel: () => void;
};

export default function CategoryForm({ initial = {}, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial.category ?? '');
  const [icon, setIcon] = useState<string | null | undefined>(initial.categoryIcon ?? null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...initial, category: name, categoryIcon: icon ?? null });
  }

  return (
    <form onSubmit={submit}>
      <label>Nome</label>
      <input aria-label="Nome" value={name} onChange={e => setName(e.target.value)} required />
      <label className="mt-2">Icona</label>
      <IconPicker value={icon ?? null} onChange={setIcon} />
      <div className="mt-3">
        <button type="submit">Salva</button>
        <button type="button" onClick={onCancel}>Annulla</button>
      </div>
    </form>
  );
}
