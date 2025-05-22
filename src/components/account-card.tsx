
import type { Account, Security } from '@/types/account';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface AccountCardProps {
  account: Account;
  className?: string;
  style?: React.CSSProperties;
  marketPrices?: Record<string, number>;
}

export function AccountCard({ account, className, style, marketPrices = {} }: AccountCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)} style={style}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-center">
          <CardTitle className="text-xl font-semibold text-center">{account.name}</CardTitle>
        </div>
      </CardHeader>
      {account.securities && account.securities.length > 0 && (
        <CardContent className="pt-2 pb-4 flex-grow">
          <CardDescription className="mb-2 text-sm font-medium text-center">Securities</CardDescription>
          <ScrollArea className="rounded-md border"> {/* Removed h-[200px] */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10 px-3 text-xs">Symbol</TableHead>
                  <TableHead className="h-10 px-3 text-xs">Description</TableHead>
                  <TableHead className="h-10 px-3 text-xs text-right">Qty</TableHead>
                  <TableHead className="h-10 px-3 text-xs text-right">Unit Cost</TableHead>
                  <TableHead className="h-10 px-3 text-xs text-right">Total Cost</TableHead>
                  <TableHead className="h-10 px-3 text-xs text-right">Price</TableHead>
                  <TableHead className="h-10 px-3 text-xs text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.securities.map((security: Security, index: number) => {
                  const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                  const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                  const symbol = security.symbol || 'N/A';
                  const description = security.description || 'No description';
                  const currentPrice = marketPrices[symbol] || 0;
                  const currentValue = quantity * currentPrice;

                  return (
                    <TableRow key={index}>
                      <TableCell className="px-3 py-2 text-xs font-medium">{symbol}</TableCell>
                      <TableCell className="px-3 py-2 text-xs">{description}</TableCell>
                      <TableCell className="px-3 py-2 text-xs text-right">{quantity}</TableCell>
                      <TableCell className="px-3 py-2 text-xs text-right">${unitcostValue.toFixed(2)}</TableCell>
                      <TableCell className="px-3 py-2 text-xs text-right">${(quantity * unitcostValue).toFixed(2)}</TableCell>
                      <TableCell className="px-3 py-2 text-xs text-right">${currentPrice.toFixed(2)}</TableCell>
                      <TableCell className="px-3 py-2 text-xs text-right">${currentValue.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
