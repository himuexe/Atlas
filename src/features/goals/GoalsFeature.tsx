import { useGoalsContext } from './GoalsContext';
import { GoalCard } from './GoalCard';
import { GoalInputForm } from './GoalInputForm';

export function GoalsFeature() {
  const { goals, addGoal, toggleGoal, removeGoal, completedCount } = useGoalsContext();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Goal tracking</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Keep a few gentle commitments visible</h2>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400">
          Goals should feel calm and helpful. Keep them small enough to follow through.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Progress</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{completedCount} of {goals.length} complete</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
              {goals.length} goals
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
              Add a small goal to give your week a little direction.
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onToggle={toggleGoal} onRemove={removeGoal} />
              ))}
            </div>
          )}
        </section>

        <GoalInputForm onAdd={addGoal} />
      </div>
    </div>
  );
}
