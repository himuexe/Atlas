import { FormEvent, useState } from 'react';
import { GoalMilestone, GoalWithMilestones } from './types';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { listItemTransition, listItemVariants } from '../../components/ui/motionPresets';

interface GoalCardProps {
  goal: GoalWithMilestones;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMilestone: (goalId: string, title: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onRemoveMilestone: (goalId: string, milestoneId: string) => void;
  onMoveMilestone: (goalId: string, milestoneId: string, direction: -1 | 1) => void;
}

export function GoalCard({ goal, onToggle, onRemove, onAddMilestone, onToggleMilestone, onRemoveMilestone, onMoveMilestone }: GoalCardProps) {
  const reducedMotion = useReducedMotion();
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const milestones = [...goal.milestones].sort((a, b) => a.position - b.position);

  const handleAddMilestone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = milestoneTitle.trim();
    if (!title || milestones.length >= 5) return;
    onAddMilestone(goal.id, title);
    setMilestoneTitle('');
    setIsAddingMilestone(false);
  };

  return (
    <motion.article
      layout={reducedMotion === false}
      variants={listItemVariants}
      initial={reducedMotion !== false ? false : 'initial'}
      animate="enter"
      exit="exit"
      transition={listItemTransition(reducedMotion)}
      className="rounded-[22px] border border-white/10 bg-[#060606]/90 px-4 py-4 sm:px-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Outcome</p>
          <h4 className={`mt-2 text-base font-semibold ${goal.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
            {goal.title}
          </h4>
          {goal.note ? <p className="mt-2 text-sm leading-6 text-zinc-400">{goal.note}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
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

      <section aria-label={`Roadmap for outcome: ${goal.title}`} className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h5 className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Milestones</h5>
            <p className="mt-1 text-xs text-zinc-500">{milestones.length} of 5 · add only the steps that help</p>
          </div>
          {milestones.length < 5 && !isAddingMilestone && (
            <button
              type="button"
              onClick={() => setIsAddingMilestone(true)}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.07]"
            >
              Add milestone
            </button>
          )}
        </div>

        {milestones.length > 0 ? (
          <ol aria-label={`Ordered milestones for outcome: ${goal.title}`} className="mt-4 space-y-0">
            <AnimatePresence initial={false}>
              {milestones.map((milestone, index) => (
                <MilestoneRow
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  total={milestones.length}
                  onToggle={() => onToggleMilestone(goal.id, milestone.id)}
                  onRemove={() => onRemoveMilestone(goal.id, milestone.id)}
                  onMove={(direction) => onMoveMilestone(goal.id, milestone.id, direction)}
                />
              ))}
            </AnimatePresence>
          </ol>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No milestones yet. The outcome can stand on its own.</p>
        )}

        {isAddingMilestone && (
          <form onSubmit={handleAddMilestone} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor={`milestone-${goal.id}`}>Milestone for {goal.title}</label>
            <input
              id={`milestone-${goal.id}`}
              autoFocus
              value={milestoneTitle}
              onChange={(event) => setMilestoneTitle(event.target.value)}
              maxLength={120}
              required
              placeholder="A small step toward this outcome"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
            <button type="submit" disabled={!milestoneTitle.trim()} className="rounded-2xl bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">
              Save step
            </button>
            <button type="button" onClick={() => { setIsAddingMilestone(false); setMilestoneTitle(''); }} className="rounded-2xl border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-300">
              Cancel
            </button>
          </form>
        )}
      </section>
    </motion.article>
  );
}

function MilestoneRow({
  milestone,
  index,
  total,
  onToggle,
  onRemove,
  onMove,
}: {
  milestone: GoalMilestone;
  index: number;
  total: number;
  onToggle: () => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const reducedMotion = useReducedMotion();
  const status = milestone.completed ? 'Completed' : 'Not completed';

  return (
    <motion.li
      layout={reducedMotion === false}
      variants={listItemVariants}
      initial={reducedMotion !== false ? false : 'initial'}
      animate="enter"
      exit="exit"
      transition={listItemTransition(reducedMotion)}
      aria-label={`${milestone.title}: ${status}`}
      className="goal-milestone-row relative flex items-center gap-3 py-2.5 pl-1"
    >
      {index < total - 1 && <span aria-hidden="true" className={`goal-milestone-connector absolute bottom-[-0.6rem] left-[0.7rem] top-7 ${milestone.completed ? 'is-complete' : ''}`} />}
      <span aria-hidden="true" className={`goal-milestone-node z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] ${milestone.completed ? 'border-white bg-white text-black' : 'border-white/25 bg-[#060606] text-zinc-500'}`}>
        {milestone.completed ? '✓' : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${milestone.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{milestone.title}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">{status}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${milestone.title} earlier`} className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">↑</button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${milestone.title} later`} className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">↓</button>
        <button type="button" onClick={onToggle} aria-label={`${milestone.completed ? 'Mark incomplete' : 'Mark complete'}: ${milestone.title}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-zinc-300">
          {milestone.completed ? 'Undo' : 'Done'}
        </button>
        <button type="button" onClick={onRemove} aria-label={`Remove milestone: ${milestone.title}`} className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-white">×</button>
      </div>
    </motion.li>
  );
}
