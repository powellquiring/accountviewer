
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
               <TableRow className="[&>th]:text-xs">
                 <TableHead className="h-10 px-3 cursor-pointer" onClick={() => handleSort('symbol')}>
                   Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-10 px-3 text-xs hidden md:table-cell">Description</TableHead>
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('quantity')}>
                   Qty {sortBy === 'quantity' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('unitcost')}>
                   Unit Cost {sortBy === 'unitcost' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('unitcost')}> {/* Sorting total cost by unit cost as a proxy */}
                   Total Cost {sortBy === 'unitcost' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('value')}> {/* Sorting by calculated value */}
                   Price {sortBy === 'value' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('value')}> {/* Sorting by calculated value */}
                   Value {sortBy === 'value' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
                 <TableHead className="h-10 px-3 text-right cursor-pointer" onClick={() => handleSort('return')}>
                   Return {sortBy === 'return' && (sortOrder === 'asc' ? '▲' : '▼')}
                 </TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
             {useMemo(() => {
                 const sortedSecurities = [...account.securities].sort((a, b) => {
                   const aValue = typeof a.quantity === 'number' && typeof marketPrices[a.symbol || ''] === 'number' ? a.quantity * marketPrices[a.symbol || ''] : 0;
                   const bValue = typeof b.quantity === 'number' && typeof marketPrices[b.symbol || ''] === 'number' ? b.quantity * marketPrices[b.symbol || ''] : 0;

                   if (sortBy === 'value') {
                     if (sortOrder === 'asc') return aValue - bValue;
                     return bValue - aValue;
                   }
                   if (sortBy === 'return') {
                     const aReturn = typeof a.quantity === 'number' && typeof a.unitcost === 'number' && typeof marketPrices[a.symbol || ''] === 'number' ? (a.quantity * marketPrices[a.symbol || '']) - (a.quantity * a.unitcost) : 0;
                     const bReturn = typeof b.quantity === 'number' && typeof b.unitcost === 'number' && typeof marketPrices[b.symbol || ''] === 'number' ? (b.quantity * marketPrices[b.symbol || '']) - (b.quantity * b.unitcost) : 0;
                     if (sortOrder === 'asc') return aReturn - bReturn;
                     return bReturn - aReturn;
                   }

                   if (sortBy && sortBy !== 'description') {
                     const aVal = typeof a[sortBy] === 'number' ? a[sortBy] : Infinity * (sortOrder === 'asc' ? 1 : -1);
                     const bVal = typeof b[sortBy] === 'number' ? b[sortBy] : Infinity * (sortOrder === 'asc' ? 1 : -1);

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
                     <TableRow key={index}>
                       <TableCell className="px-3 py-2 text-xs font-medium">{symbol}</TableCell>
                       <TableCell className="px-3 py-2 text-xs hidden md:table-cell">{description}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums">{quantity.toFixed(2)}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${unitcostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${(quantity * unitcostValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${(currentValue - (quantity * unitcostValue)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                     </TableRow>
                   );
                 }).concat(
                   <TableRow key="total">
                     <TableCell className="px-3 py-2 text-xs font-medium">Total</TableCell>
                     <TableCell className="px-3 py-2 text-xs hidden md:table-cell"></TableCell> {/* Empty Description */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums"></TableCell> {/* Empty Quantity */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums"></TableCell> {/* Empty Unit Cost */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${sortedSecurities.reduce((sum, security) => {
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       const unitcostValue = typeof security.unitcost === 'number' ? security.unitcost : 0;
                       return sum + quantity * unitcostValue;
                     }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* This cell now aligns with Total Cost */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums"></TableCell> {/* Empty Price */}
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${sortedSecurities.reduce((sum, security) => {
                       const quantity = typeof security.quantity === 'number' ? security.quantity : 0;
                       return sum + quantity * (marketPrices[security.symbol || ''] || 0);
                     }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                     <TableCell className="px-3 py-2 text-xs text-right tabular-nums">${sortedSecurities.reduce((sum, security) => {
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
