import { useGamificationContext } from './GamificationContext';

export function MilestonesDisplay() {
  const { milestones, unlockedMilestones, currentCheckInStreak } = useGamificationContext();

  // Get next milestone
  const nextMilestone = milestones.find((m) => m.type === 'check-in-streak' && !m.unlockedAt);
  const daysUntilNext = nextMilestone ? nextMilestone.threshold - currentCheckInStreak : 0;

  return (
    <div className="space-y-4">
      {/* Unlocked Milestones */}
      {unlockedMilestones.length > 0 && (
        <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Unlocked Milestones</p>
          <div className="mt-4 space-y-2">
            {unlockedMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <p className="text-sm font-semibold text-white">{milestone.description}</p>
                  <p className="text-xs text-zinc-500">
                    {milestone.unlockedAt
                      ? new Date(milestone.unlockedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Just now'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Next Milestone</p>
          <div className="mt-3">
            <p className="text-sm font-semibold text-white">{nextMilestone.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-zinc-400">{currentCheckInStreak} / {nextMilestone.threshold} days</p>
              <p className="text-xs font-semibold text-zinc-300">{daysUntilNext} days to go</p>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white/60 transition-all duration-300"
                style={{ width: `${(currentCheckInStreak / nextMilestone.threshold) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
