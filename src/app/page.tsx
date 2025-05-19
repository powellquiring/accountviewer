"use client";

import type { Account } from '@/types/account';
import { useEffect, useState } from 'react';
import { AccountCard } from '@/components/account-card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Button } from '@/components/ui/button'; // For potential "retry" button
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // Example for retry icon

export default function HomePage() {
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [renderedAccounts, setRenderedAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    setRenderedAccounts([]); // Reset rendered accounts on new fetch
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: Account[] = await response.json();
      setAllAccounts(data);
    } catch (e: any) {
      console.error("Failed to fetch accounts:", e);
      setError(e.message || 'Could not load accounts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (allAccounts.length > 0 && renderedAccounts.length < allAccounts.length) {
      const timer = setTimeout(() => {
        setRenderedAccounts(prev => [...prev, allAccounts[prev.length]]);
      }, 200); // Progressive rendering delay
      return () => clearTimeout(timer);
    }
  }, [allAccounts, renderedAccounts]);

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-primary tracking-tight">AccountViewer</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your accounts, displayed progressively.
        </p>
      </header>

      {isLoading && <LoadingSpinner className="my-16" />}

      {error && !isLoading && (
        <div className="my-16 flex flex-col items-center gap-4">
          <ErrorMessage message={error} />
          <Button onClick={fetchAccounts} variant="outline">
             Retry {/* Using a simple text, could add an icon */}
          </Button>
        </div>
      )}

      {!isLoading && !error && allAccounts.length === 0 && (
         <div className="text-center text-muted-foreground py-10">
           <p className="text-xl">No accounts found.</p>
           <p>Try adding some accounts or check back later.</p>
         </div>
      )}

      {!isLoading && !error && renderedAccounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderedAccounts.map((account, index) => (
            <AccountCard
              key={account.id}
              account={account}
              className="animate-in fade-in slide-in-from-bottom-5 duration-500 ease-out"
              style={{ animationDelay: `${index * 50}ms` }} // Stagger animation slightly
            />
          ))}
        </div>
      )}
       {!isLoading && !error && allAccounts.length > 0 && renderedAccounts.length < allAccounts.length && (
        <div className="mt-8 flex justify-center">
          <LoadingSpinner size={24} /> 
          <p className="ml-2 text-muted-foreground">Loading more accounts...</p>
        </div>
      )}
    </main>
  );
}
