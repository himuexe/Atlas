import { useDailyFocus } from './useDailyFocus';
import { FocusInputForm } from './FocusInputForm';
import { FocusItemCard } from './FocusItemCard';

export function FocusFeature() {
  const { items, addItem, toggleCompletion, removeItem, completedCount, canAddItem, maxItems } = useDailyFocus();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Today's Focus</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Capture your top priorities for today</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Keep your day centered on a small set of meaningful actions. Mark tasks complete as you make progress.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Progress</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{completedCount} of {items.length} complete</h3>
              </div>
              <div className="rounded-3xl bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                {items.length}/{maxItems}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Daily focus works best when it is small, specific, and actionable.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
            <h3 className="text-xl font-semibold text-white">Focus items</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Use a maximum of three items to stay clear and avoid overload.</p>

            {items.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-sm text-slate-400">
                Add your first focus item to begin.
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {items.map((item) => (
                  <FocusItemCard
                    key={item.id}
                    item={item}
                    onToggle={toggleCompletion}
                    onRemove={removeItem}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        <FocusInputForm onAdd={addItem} disabled={!canAddItem} maxItems={maxItems} />
      </div>
    </div>
  );
}
