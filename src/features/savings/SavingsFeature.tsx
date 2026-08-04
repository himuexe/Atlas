import { FormEvent, useMemo, useState } from 'react';
import { useSavingsContext } from './SavingsContext';

export function SavingsFeature() {
  const { entries, addEntry, removeEntry, balance } = useSavingsContext();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'income' | 'expense' | 'savings'>('savings');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim() || Number.isNaN(parsedAmount)) {
      return;
    }

    addEntry(parsedAmount, description, category);
    setDescription('');
    setAmount('');
    setCategory('savings');
  };

  const summary = useMemo(() => {
    if (entries.length === 0) {
      return 'Start tracking small deposits or withdrawals to build a clearer picture of your savings.';
    }

    const positiveEntries = entries.filter((entry) => entry.amount > 0).length;
    const negativeEntries = entries.filter((entry) => entry.amount < 0).length;
    return `Current balance ₹${balance.toFixed(2)} • ${positiveEntries} inflows • ${negativeEntries} outflows`;
  }, [balance, entries]);

  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">Savings</p>
        <h2 className="page-title mt-4">Track progress with calm, simple numbers.</h2>
        <p className="page-copy mt-4">{summary}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Balance</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">₹{balance.toFixed(2)}</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
              {entries.length} entries
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {entries.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
                Add your first savings entry to begin tracking progress.
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.description}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-zinc-500">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${entry.amount >= 0 ? 'text-zinc-200' : 'text-zinc-400'}`}>
                      {entry.amount >= 0 ? '+' : ''}₹{entry.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">New entry</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Add a deposit or withdrawal</h3>
          </div>

          <label className="block text-sm text-zinc-300">
            Description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Salary, bonus, groceries..."
              className="mt-2 w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Amount
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="25"
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as 'income' | 'expense' | 'savings')}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Savings</option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            Save entry
          </button>
        </form>
      </div>
    </div>
  );
}
