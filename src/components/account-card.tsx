import type { Account } from '@/types/account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, Landmark, CreditCard, TrendingUp, DollarSign, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  account: Account;
  className?: string;
}

const accountTypeIcons = {
  Savings: PiggyBank,
  Checking: Landmark,
  'Credit Card': CreditCard,
  Investment: TrendingUp,
};

const currencyIcons = {
  USD: DollarSign,
  EUR: Euro,
};

export function AccountCard({ account, className }: AccountCardProps) {
  const Icon = accountTypeIcons[account.accountType];
  const CurrencyIcon = currencyIcons[account.currency as keyof typeof currencyIcons] || DollarSign;

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">{account.accountName}</CardTitle>
          {Icon && <Icon className="h-7 w-7 text-primary" />}
        </div>
        <CardDescription className="text-sm">
          {account.accountType} &bull; {account.accountNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 text-2xl font-bold text-foreground">
          <CurrencyIcon className="h-6 w-6" />
          <span>{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-lg font-normal text-muted-foreground">{account.currency}</span>
        </div>
      </CardContent>
    </Card>
  );
}
