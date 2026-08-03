export interface SavingsEntry {
  id: string;
  amount: number;
  description: string;
  category: 'income' | 'expense' | 'savings';
  createdAt: string;
}
