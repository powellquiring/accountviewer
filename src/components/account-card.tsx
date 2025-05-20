
import type { Account } from '@/types/account';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

interface AccountCardProps {
  account: Account;
  className?: string;
}

export function AccountCard({ account, className }: AccountCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-center">
          <CardTitle className="text-xl font-semibold text-center">{account.name}</CardTitle>
        </div>
      </CardHeader>
      {account.securities && account.securities.length > 0 && (
        <CardContent className="pt-2 pb-4 flex-grow">
          <CardDescription className="mb-2 text-sm font-medium text-center">Securities</CardDescription>
          <ScrollArea className="h-[150px] rounded-md border p-2">
            <ul className="space-y-2">
              {account.securities.map((security, index) => (
                <li key={index} className="text-xs p-2 bg-muted/50 rounded-md shadow-sm">
                  <div className="font-semibold">{security.symbol} - {security.description}</div>
                  <div>Quantity: {security.quantity}</div>
                  <div>Unit Cost: ${security.unitCost.toFixed(2)}</div>
                  <div>Total Value: ${(security.quantity * security.unitCost).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      )}
      {(!account.securities || account.securities.length === 0) && (
         <CardContent className="pt-2 pb-4 text-center">
            <p className="text-sm text-muted-foreground">No securities for this account.</p>
         </CardContent>
      )}
    </Card>
  );
}
