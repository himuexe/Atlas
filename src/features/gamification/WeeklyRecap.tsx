import { useMemo } from 'react';
import { useGamificationContext } from './GamificationContext';

export function WeeklyRecap() {
  const { allCheckIns, xpEvents, unlockedMilestones } = useGamificationContext();

  const weekData = useMemo(() => {
    const today = new Date();
    const sundayDate = new Date(today);
    sundayDate.setDate(today.getDate() - today.getDay());

    const weekStart = sundayDate.toISOString().slice(0, 10);
    const weekEnd = new Date(sundayDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    // Check-ins this week
    const weekCheckIns = allCheckIns.filter((c) => c.date >= weekStart && c.date <= weekEndStr);
    
    // XP this week
    const weekXP = xpEvents.filter((e) => e.date >= weekStart && e.date <= weekEndStr);
    const totalWeeklyXP = weekXP.reduce((sum, e) => sum + e.amount, 0);

    // Milestones unlocked this week
    const weekMilestones = unlockedMilestones.filter((m) => {
      if (!m.unlockedAt) return false;
      return m.unlockedAt >= `${weekStart}T00:00:00` && m.unlockedAt <= `${weekEndStr}T23:59:59`;
    });

    return {
      weekStart,
      checkInCount: weekCheckIns.length,
      totalXP: totalWeeklyXP,
      milestonesCount: weekMilestones.length,
      checkInStreak: weekCheckIns.length > 0 ? Math.ceil(weekCheckIns.length / 3) : 0, // Simple estimation
    };
  }, [allCheckIns, xpEvents, unlockedMilestones]);

  const isToday = new Date().getDay() === 0; // Sunday
  
  if (!isToday) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Weekly Recap</p>
          <h3 className="mt-2 text-lg font-semibold text-white">This Week's Summary</h3>
        </div>
        <span className="text-2xl">📊</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Check-ins</p>
          <p className="mt-2 text-3xl font-semibold text-white">{weekData.checkInCount}</p>
          <p className="mt-1 text-xs text-zinc-400">out of 7 days</p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">XP Earned</p>
          <p className="mt-2 text-3xl font-semibold text-white">{weekData.totalXP}</p>
          <p className="mt-1 text-xs text-zinc-400">this week</p>
        </div>

        {weekData.milestonesCount > 0 && (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Milestones Unlocked</p>
            <p className="mt-2 text-xl font-semibold text-white">🎯 {weekData.milestonesCount}</p>
            <p className="mt-1 text-xs text-zinc-400">Great consistency this week!</p>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm text-zinc-300">
          You checked in {weekData.checkInCount} time{weekData.checkInCount !== 1 ? 's' : ''} this week.
          {weekData.checkInCount === 7 ? (
            <span className="block mt-2 font-semibold text-white">Perfect week! Keep up the momentum.</span>
          ) : (
            <span className="block mt-2">Keep building your streak next week.</span>
          )}
        </p>
      </div>
    </div>
  );
}
