import { useFocus } from './FocusContext';
import { FocusInputForm } from './FocusInputForm';
import { FocusItemCard } from './FocusItemCard';

export function FocusFeature() {
  const { items, addItem, toggleCompletion, removeItem, completedCount, canAddItem, maxItems } = useFocus();

  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">Today's Focus</p>
        <h2 className="page-title mt-4">Capture your top priorities for today.</h2>
        <p className="page-copy mt-4">
          Keep your day centered on a small set of meaningful actions. Mark tasks complete as you make progress.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Progress</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{completedCount} of {items.length} complete</h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
                {items.length}/{maxItems}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Daily focus works best when it is small, specific, and actionable.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <h3 className="text-xl font-semibold tracking-tight text-white">Focus items</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Use a maximum of three items to stay clear and avoid overload. Keep each item anchored to one concrete action.</p>

            {items.length === 0 ? (
              <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
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
