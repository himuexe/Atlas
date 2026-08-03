interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    note?: string;
    completed: boolean;
    createdAt: string;
  };
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function GoalCard({ goal, onToggle, onRemove }: GoalCardProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#060606]/90 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${goal.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
            {goal.title}
          </p>
          {goal.note ? <p className="mt-2 text-sm text-zinc-400">{goal.note}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(goal.id)}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300"
          >
            {goal.completed ? 'Undo' : 'Done'}
          </button>
          <button
            type="button"
            onClick={() => onRemove(goal.id)}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
