import type { Account } from '@/types/account';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  account: Account;
  className?: string;
}

export function AccountCard({ account, className }: AccountCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300", className)}>
      <CardHeader className="pb-3 pt-3"> {/* Adjusted padding for simpler card */}
        <div className="flex items-center justify-center"> {/* Centering title */}
          <CardTitle className="text-xl font-semibold text-center">{account.name}</CardTitle>
        </div>
      </CardHeader>
      {/* CardContent and CardDescription are removed as other fields are no longer present */}
    </Card>
  );
}
