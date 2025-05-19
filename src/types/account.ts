export interface Account {
  id: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  currency: string;
  accountType: 'Savings' | 'Checking' | 'Credit Card' | 'Investment';
}
