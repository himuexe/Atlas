export interface SavingsEntry {
  id: string;
  amount: number;
  description: string;
  category: 'income' | 'expense' | 'savings';
  createdAt: string;
}

export function calculateBalance(entries: SavingsEntry[]) {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}
