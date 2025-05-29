
import type { Account, Security } from '@/types/account';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, } from '@/components/ui/card';
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
  const [sortBy, setSortBy] = useState<keyof Security | 'value' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof Security | 'value') => {
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
     <CardHeader className="pb-3 pt-4">
       <div className="flex items-center justify-start">
 <CardTitle className="text-xl font-semibold pl-4">{account.name}</CardTitle>
       </div>
     </CardHeader>
     {account.securities && account.securities.length > 0 && (
       <CardContent className="pt-2 pb-4 flex-grow">
         
 <ScrollArea className="rounded-md border w-full overflow-x-auto">
           <Table>
             <TableHeader>
               <TableRow className="[&>th]:text-xs">
                 <TableHead className="h-10 px-3 cursor-pointer w-1/12" onClick={() => handleSort('symbol')}>
                   Sym {sortBy === 'symbol' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
 <TableHead className="h-10 px-3 text-xs hidden md:table-cell">Description</TableHead>
 <TableHead className="h-10 px-3 text-right cursor-pointer hidden md:table-cell" onClick={() => handleSort('quantity')}>
                   Qty {sortBy === 'quantity' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
 <TableHead className="h-10 px-3 text-right cursor-pointer hidden lg:table-cell" onClick={() => handleSort('unitcost')}>
                   Unit Cost {sortBy === 'unitcost' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('totalCost')}>
                   Total Cost {sortBy === 'totalCost' && (sortOrder === 'asc' ? '▲' : '▼')}
 </TableHead> {/* This column should be removed if not needed for small screens */}
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('price')}>
                   Price {sortBy === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('value')}> {/* Sorting by calculated value */}
                   Value {sortBy === 'value' && (sortOrder === 'asc' ? '▲' : '▼')}
 </TableHead> {/* This column should be the main focus on small screens */}
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('return')}>
                   Return {sortBy === 'return' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
             {useMemo(() => {
                 const sortedSecurities = [...(account.securities || [])].sort((a, b) => {
                   const aValue = typeof a.quantity === 'number' && typeof marketPrices[a.symbol || ''] === 'number' ? a.quantity * marketPrices[a.symbol || ''] : 0;
                   const bValue = typeof b.quantity === 'number' && typeof marketPrices[b.symbol || ''] === 'number' ? b.quantity * marketPrices[b.symbol || ''] : 0;

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
                   if (sortBy === 'totalCost') {
                    // Added sorting logic for totalCost
                   }
                   if (sortBy === 'price') {
                    const aPrice = typeof marketPrices[a.symbol || ''] === 'number' ? marketPrices[a.symbol || ''] : 0;
                    const bPrice = typeof marketPrices[b.symbol || ''] === 'number' ? marketPrices[b.symbol || ''] : 0;
                    if (sortOrder === 'asc') return aPrice - bPrice;
                    return bPrice - aPrice;
                   }
                   if (sortBy === 'totalCost') {
                   }
                   if (sortBy === 'totalCost') {
                     const aTotalCost = typeof a.quantity === 'number' && typeof a.unitcost === 'number' ? a.quantity * a.unitcost : 0;
                     const bTotalCost = typeof b.quantity === 'number' && typeof b.unitcost === 'number' ? b.quantity * b.unitcost : 0;
                     if (sortOrder === 'asc') return aTotalCost - bTotalCost;
                     return bTotalCost - aTotalCost;
                   }
                   if (sortBy === 'return') {
                     const aReturn = typeof a.quantity === 'number' && typeof a.unitcost === 'number' && typeof marketPrices[a.symbol || ''] === 'number' ? (a.quantity * marketPrices[a.symbol || '']) - (a.quantity * a.unitcost) : 0;
                     const bReturn = typeof b.quantity === 'number' && typeof b.unitcost === 'number' && typeof marketPrices[b.symbol || ''] === 'number' ? (b.quantity * marketPrices[b.symbol || '']) - (b.quantity * b.unitcost) : 0;
                     if (sortOrder === 'asc') return aReturn - bReturn;
                     return bReturn - aReturn;
                   }

                   if (sortBy && sortBy !== 'description') {
                     const aVal = typeof (a as any)[sortBy] === 'number' ? (a as any)[sortBy] : Infinity * (sortOrder === 'asc' ? 1 : -1);
                     const bVal = typeof (b as any)[sortBy] === 'number' ? (b as any)[sortBy] : Infinity * (sortOrder === 'asc' ? 1 : -1);


                     if (aVal === bVal) return 0;
                     if (sortOrder === 'asc') return aVal < bVal ? -1 : 1;
                     return bVal < aVal ? -1 : 1;
                   }
                   return 0; // No sorting or sorting by description (which is not sortable)
                 });

                 return sortedSecurities.map((security: Security, index: number) => {
                   let totalValue = 0;
                   let totalTotalCost = 0;

                   const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                   const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                   const symbol = security.symbol || 'N/A';
                   const description = security.description || 'No description';
                   const currentPrice = marketPrices[symbol] || 0;
                   const currentValue = quantity * currentPrice;


                   return (
 <TableRow key={index} className="[&>td]:px-2 [&>td]:py-1 [&>td]:text-xs"> {/* Reduced padding and font size */}
                       <TableCell className="px-3 py-2 text-xs font-medium">{symbol}</TableCell>
                       <TableCell className="px-3 py-2 text-xs hidden md:table-cell">{description}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums hidden md:table-cell">{quantity.toFixed(2)}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums hidden lg:table-cell">{unitcostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Removed $ */}
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums w-[100px]">{ (quantity * unitcostValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Removed $ and set width */}
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums w-[80px]">{currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Removed $ and set width */}
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums w-[100px]">{currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Removed $ and set width */}
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums w-[100px]">{(currentValue - (quantity * unitcostValue)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Removed $ and set width */}
                     </TableRow>
                   );
                 }).concat(
 <TableRow key="total" className="[&>td]:px-2 [&>td]:py-1 [&>td]:text-xs font-bold"> {/* Reduced padding and font size, added bold */}
                     <TableCell className="px-3 py-2 text-xs font-medium">Total</TableCell>
                     <TableCell className="px-3 py-2 text-xs hidden md:table-cell"></TableCell> {/* Empty Description */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums hidden md:table-cell"></TableCell> {/* Empty Quantity */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums hidden lg:table-cell"></TableCell> {/* Empty Unit Cost */}
 <TableCell className="px-3 py-2 text-xs text-right tabular-nums w-[100px]">{sortedSecurities.reduce((sum, security) => { {/* Removed $ and set width */}
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                       return sum + quantity * unitcostValue;
 }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* This cell now aligns with Total Cost */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums"></TableCell> {/* Empty Price */}
 <TableCell className="px-3 py-2 text-xs text-right tabular-nums w-[100px]">{sortedSecurities.reduce((sum, security) => { {/* Removed $ and set width */}
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       return sum + quantity * (marketPrices[security.symbol || ''] || 0);
 }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
 <TableCell className="px-3 py-2 text-xs text-right tabular-nums w-[100px]">{sortedSecurities.reduce((sum, security) => { {/* Removed $ and set width */}
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                       return sum + (quantity * (marketPrices[security.symbol || ''] || 0)) - (quantity * unitcostValue);
                     }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                   </TableRow>);
               }, [account.securities, marketPrices, sortBy, sortOrder])}
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
 </>
  );
}
