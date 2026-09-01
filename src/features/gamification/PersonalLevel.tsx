import { useGamificationContext } from './GamificationContext';

export function PersonalLevel() {
  const { level } = useGamificationContext();

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Your Progress</p>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-5xl font-bold text-white">{level.level}</div>
            <div>
              <p className="text-sm text-zinc-400">Atlas Level</p>
              <p className="text-xs text-zinc-500 mt-1">{level.totalXP} total XP</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Next level</p>
              <p className="text-xs text-zinc-400">{level.xpForNextLevel} XP to go</p>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${level.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Level indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${2.827 * 45 * (level.progressPercentage / 100)} ${2.827 * 45}`}
                className="text-white transition-all duration-500"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-bold text-white">{level.progressPercentage}%</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">Level Progress</p>
        </div>
      </div>
    </div>
  );
}
