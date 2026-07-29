import { FocusItem } from './types';

interface FocusItemCardProps {
  item: FocusItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function FocusItemCard({ item, onToggle, onRemove }: FocusItemCardProps) {
  return (
    <li className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4 shadow-sm shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <label className="flex-1 cursor-pointer">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggle(item.id)}
              className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
            />
            <div>
              <p className={`text-base font-medium ${item.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                {item.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">Added today</p>
            </div>
          </div>
        </label>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
