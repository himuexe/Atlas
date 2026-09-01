import { useState, useEffect } from 'react';
import { useGamificationContext } from './GamificationContext';

export function CheckInCard() {
  const { checkIn, addCheckIn, currentCheckInStreak, xpEvents } = useGamificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<'poor' | 'neutral' | 'good' | 'great'>('neutral');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [intention, setIntention] = useState('');
  const [win, setWin] = useState('');
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showXPFeedback, setShowXPFeedback] = useState(false);
  const [todayXP, setTodayXP] = useState(0);

  // Calculate today's XP
  useEffect(() => {
    if (checkIn) {
      const today = new Date().toISOString().slice(0, 10);
      const todayEvents = xpEvents.filter((e) => e.date === today);
      const total = todayEvents.reduce((sum, e) => sum + e.amount, 0);
      setTodayXP(total);
    }
  }, [checkIn, xpEvents]);

  const moodEmojis = { poor: '😔', neutral: '😐', good: '😊', great: '🌟' };
  const energyEmojis = { low: '🔋 Low', medium: '⚡ Medium', high: '🚀 High' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intention.trim() || !win.trim() || !reflection.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await addCheckIn({
        date: today,
        mood,
        energy,
        intention: intention.trim(),
        win: win.trim(),
        reflection: reflection.trim(),
      });
      
      // Show XP feedback
      setShowXPFeedback(true);
      setTimeout(() => setShowXPFeedback(false), 3000);
      
      // Reset form
      setMood('neutral');
      setEnergy('medium');
      setIntention('');
      setWin('');
      setReflection('');
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to save check-in', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkIn) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Today's Check-in</p>
            <p className="mt-2 text-xl font-semibold text-white">✓ Done</p>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{moodEmojis[checkIn.mood]}</span>
                <span className="capitalize text-sm text-zinc-400">{checkIn.mood}</span>
              </div>
              <div className="text-sm text-zinc-400">Energy: {checkIn.energy}</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Your {currentCheckInStreak}-day streak continues. Keep it going!
            </p>
            {todayXP > 0 && (
              <p className="mt-2 text-xs font-semibold text-white/70">
                +{todayXP} XP earned today
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-300">
            🔥 {currentCheckInStreak} days
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
      {!isOpen ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Daily Check-in</p>
            <p className="mt-2 text-lg font-semibold text-white">Start your reflection</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Take a moment to check in with your mood, energy, and intention for today.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-100 transition-colors whitespace-nowrap"
          >
            Check in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold text-white">How are you today?</h3>

          {/* Mood */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Mood</label>
            <div className="mt-2 flex gap-3">
              {Object.entries(moodEmojis).map(([value, emoji]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMood(value as any)}
                  className={`text-2xl px-3 py-2 rounded-lg transition-all ${
                    mood === value ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Energy Level</label>
            <div className="mt-2 flex gap-3">
              {Object.entries(energyEmojis).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEnergy(value as any)}
                  className={`text-sm px-3 py-2 rounded-lg border transition-all ${
                    energy === value
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Intention */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Intention</label>
            <input
              type="text"
              placeholder="What will you focus on today?"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition-colors"
            />
          </div>

          {/* Win */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Today's Win</label>
            <input
              type="text"
              placeholder="What counts as a win for you?"
              value={win}
              onChange={(e) => setWin(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition-colors"
            />
          </div>

          {/* Reflection */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Reflection</label>
            <textarea
              placeholder="What's on your mind?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !intention.trim() || !win.trim() || !reflection.trim()}
              className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Check-in'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* XP Feedback */}
          {showXPFeedback && (
            <div className="mt-4 rounded-lg border border-white/20 bg-white/10 p-3 text-sm font-semibold text-white text-center animate-pulse">
              ✨ Check-in saved! +XP earned
            </div>
          )}
        </form>
      )}
    </div>
  );
}
