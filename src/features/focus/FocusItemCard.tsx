import { FocusItem } from './types';

interface FocusItemCardProps {
  item: FocusItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function FocusItemCard({ item, onToggle, onRemove }: FocusItemCardProps) {
  return (
    <li className="rounded-[22px] border border-white/10 bg-[#060606]/90 p-4">
      <div className="flex items-start justify-between gap-4">
        <label className="flex-1 cursor-pointer">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggle(item.id)}
              className="h-5 w-5 rounded border-white/15 bg-white/5"
            />
            <div>
              <p className={`text-base font-medium ${item.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                {item.title}
              </p>
              {item.note ? <p className="mt-1 text-sm text-zinc-400">{item.note}</p> : null}
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-zinc-500">Added today</p>
            </div>
          </div>
        </label>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-400"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
