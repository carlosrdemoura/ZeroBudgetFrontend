import { useRef, useState } from 'react';

interface Props {
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function AddCategoryRow({ onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const submittedRef = useRef(false);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && !busy) {
      submittedRef.current = true;
      setBusy(true);
      try {
        await onSave(name.trim());
      } catch {
        submittedRef.current = false;
        setBusy(false);
      }
    }
    if (e.key === 'Escape') onCancel();
  };

  const handleBlur = () => {
    if (!submittedRef.current) onCancel();
  };

  return (
    <tr className="border-b border-base-200/70">
      <td colSpan={4} className="py-1 pl-10 pr-3">
        <input
          autoFocus
          type="text"
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="New category name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={busy}
        />
      </td>
    </tr>
  );
}
