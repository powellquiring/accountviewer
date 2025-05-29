
import type { Account, Security } from '@/types/account';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React, { useState, useMemo } from 'react';
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
  const [sortBy, setSortBy] = useState<keyof Security | 'value' | 'totalCost' | 'price' | 'return' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof Security | 'value' | 'totalCost' | 'price' | 'return') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

 return (
   <>
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)} style={style}>
     <CardHeader className="px-2 py-1"> 
       <div className="flex items-center justify-start">
        <CardTitle className="text-sm font-semibold">{account.name}</CardTitle>
       </div>
     </CardHeader>
     {account.securities && account.securities.length > 0 && (
       <CardContent className="pt-1 pb-2 px-0 flex-grow">
         
        <ScrollArea className="rounded-md border w-full overflow-x-auto">
           <Table>
             <TableHeader>
               <TableRow className="[&>th]:text-[10px] [&>th]:font-semibold">
                 <TableHead className="h-8 px-2 cursor-pointer w-1/12" onClick={() => handleSort('symbol')}>
                   Sym {sortBy === 'symbol' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-8 px-2 hidden md:table-cell">Description</TableHead>
                 <TableHead className="h-8 px-2 text-right cursor-pointer hidden md:table-cell" onClick={() => handleSort('quantity')}>
                   Qty {sortBy === 'quantity' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-8 px-2 text-right cursor-pointer hidden lg:table-cell w-[80px]" onClick={() => handleSort('unitcost')}>
                   Unit Cost {sortBy === 'unitcost' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-8 px-2 text-right cursor-pointer w-[100px]" onClick={() => handleSort('totalCost')}>
                   Total Cost {sortBy === 'totalCost' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead> 
                 <TableHead className="h-8 px-2 text-right cursor-pointer w-[80px]" onClick={() => handleSort('price')}>
                   Price {sortBy === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-8 px-2 text-right cursor-pointer w-[100px]" onClick={() => handleSort('value')}> 
                   Value {sortBy === 'value' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead> 
                 <TableHead className="h-8 px-2 text-right cursor-pointer w-[100px]" onClick={() => handleSort('return')}>
                   Return {sortBy === 'return' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
             {useMemo(() => {
                 const sortedSecurities = [...(account.securities || [])].sort((a, b) => {
                   const aUnitcost = typeof a.unitcost === 'number' ? a.unitcost : 0;
                   const bUnitcost = typeof b.unitcost === 'number' ? b.unitcost : 0;
                   const aQuantity = typeof a.quantity === 'number' ? a.quantity : 0;
                   const bQuantity = typeof b.quantity === 'number' ? b.quantity : 0;
                   
                   const aCurrentPrice = marketPrices[a.symbol || ''] || 0;
                   const bCurrentPrice = marketPrices[b.symbol || ''] || 0;

                   const aValue = aQuantity * aCurrentPrice;
                   const bValue = bQuantity * bCurrentPrice;
                   const aTotalCost = aQuantity * aUnitcost;
                   const bTotalCost = bQuantity * bUnitcost;
                   const aReturn = aValue - aTotalCost;
                   const bReturn = bValue - bTotalCost;


                   if (sortBy === 'value') {
                     if (sortOrder === 'asc') return aValue - bValue;
                     return bValue - aValue;
                   }
                   if (sortBy === 'symbol') {
                     const aSymbol = a.symbol || '';
                     const bSymbol = b.symbol || '';
                     if (sortOrder === 'asc') return aSymbol.localeCompare(bSymbol);
                     return bSymbol.localeCompare(aSymbol);
                   }
                   if (sortBy === 'price') {
                    if (sortOrder === 'asc') return aCurrentPrice - bCurrentPrice;
                    return bCurrentPrice - aCurrentPrice;
                   }
                   if (sortBy === 'totalCost') {
                     if (sortOrder === 'asc') return aTotalCost - bTotalCost;
                     return bTotalCost - aTotalCost;
                   }
                   if (sortBy === 'return') {
                     if (sortOrder === 'asc') return aReturn - bReturn;
                     return bReturn - aReturn;
                   }

                   if (sortBy && sortBy !== 'description' && sortBy in a && sortBy in b) {
                     const aVal = typeof (a as any)[sortBy] === 'number' ? (a as any)[sortBy] : (sortOrder === 'asc' ? Infinity : -Infinity);
                     const bVal = typeof (b as any)[sortBy] === 'number' ? (b as any)[sortBy] : (sortOrder === 'asc' ? Infinity : -Infinity);

                     if (aVal === bVal) return 0;
                     if (sortOrder === 'asc') return aVal < bVal ? -1 : 1;
                     return bVal < aVal ? -1 : 1;
                   }
                   return 0; 
                 });

                 return sortedSecurities.map((security: Security, index: number) => {
                   const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                   const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                   const symbol = security.symbol || 'N/A';
                   const description = security.description || 'No description';
                   const currentPrice = marketPrices[symbol] || 0;
                   const currentValue = quantity * currentPrice;
                   const totalCostValue = quantity * unitcostValue;
                   const returnValue = currentValue - totalCostValue;


                   return (
                    <TableRow key={index} className="[&>td]:px-2 [&>td]:py-1 [&>td]:text-xs"> 
                       <TableCell className="font-medium">{symbol}</TableCell>
                       <TableCell className="hidden md:table-cell">{description}</TableCell>
                       <TableCell className="text-right tabular-nums hidden md:table-cell">{quantity.toFixed(2)}</TableCell>
                       <TableCell className="text-right tabular-nums hidden lg:table-cell w-[80px]">{unitcostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> 
                       <TableCell className="text-right tabular-nums w-[100px]">{totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> 
                       <TableCell className="text-right tabular-nums w-[80px]">{currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> 
                       <TableCell className="text-right tabular-nums w-[100px]">{currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> 
                       <TableCell className="text-right tabular-nums w-[100px]">{returnValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> 
                     </TableRow>
                   );
                 }).concat(
                  <TableRow key="total" className="[&>td]:px-2 [&>td]:py-1 [&>td]:text-xs font-bold"> 
                     <TableCell className="font-medium">Total</TableCell>
                     <TableCell className="hidden md:table-cell"></TableCell> 
                     <TableCell className="text-right tabular-nums hidden md:table-cell"></TableCell> 
                     <TableCell className="text-right tabular-nums hidden lg:table-cell w-[80px]"></TableCell> 
                     <TableCell className="text-right tabular-nums w-[100px]">{sortedSecurities.reduce((sum, security) => { 
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                       return sum + quantity * unitcostValue;
                      }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> 
                     <TableCell className="text-right tabular-nums w-[80px]"></TableCell> 
                     <TableCell className="text-right tabular-nums w-[100px]">{sortedSecurities.reduce((sum, security) => { 
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       return sum + quantity * (marketPrices[security.symbol || ''] || 0);
                      }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                     <TableCell className="text-right tabular-nums w-[100px]">{sortedSecurities.reduce((sum, security) => { 
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                       const currentPrice = marketPrices[security.symbol || ''] || 0;
                       return sum + (quantity * currentPrice) - (quantity * unitcostValue);
                     }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                   </TableRow>);
               }, [account.securities, marketPrices, sortBy, sortOrder])}
             </TableBody>
           </Table>
         </ScrollArea>
       </CardContent>
      )}
      {(!account.securities || account.securities.length === 0) && (
         <CardContent className="pt-1 pb-2 text-center">
            <p className="text-xs text-muted-foreground">No securities for this account.</p>
         </CardContent>
      )}
    </Card>
 </>
  );
}
