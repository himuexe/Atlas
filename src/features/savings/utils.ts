export interface SavingsEntry {
  id: string;
  amount: number;
  description: string;
  category: 'income' | 'expense' | 'savings';
  createdAt: string;
}

export function calculateBalance(entries: SavingsEntry[]) {
  return entries.reduce((total, entry) => total + getSignedAmount(entry), 0);
}

export function getSignedAmount(entry: Pick<SavingsEntry, 'amount' | 'category'>) {
  const magnitude = Math.abs(entry.amount);
  return entry.category === 'expense' ? -magnitude : magnitude;
}
