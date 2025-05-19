
"use client";

import type { Account } from '@/types/account';
import { useEffect, useState, useCallback } from 'react';
import { AccountCard } from '@/components/account-card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [renderedAccounts, setRenderedAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'firestore' | 'mock'>('firestore');

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRenderedAccounts([]); // Reset rendered accounts on new fetch
    setAllAccounts([]); // Also reset all accounts
    try {
      const response = await fetch(`/api/accounts?source=${dataSource}`);
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
  }, [dataSource]); // Add dataSource as a dependency

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]); // fetchAccounts is now memoized and includes dataSource

  useEffect(() => {
    if (allAccounts.length > 0 && renderedAccounts.length < allAccounts.length) {
      const timer = setTimeout(() => {
        setRenderedAccounts(prev => [...prev, allAccounts[prev.length]]);
      }, 200); // Progressive rendering delay
      return () => clearTimeout(timer);
    }
  }, [allAccounts, renderedAccounts]);

  const toggleDataSource = () => {
    setDataSource(prev => prev === 'firestore' ? 'mock' : 'firestore');
  };

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-primary tracking-tight">AccountViewer</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your accounts, displayed progressively.
        </p>
      </header>

      <div className="mb-6 flex justify-center">
        <Button onClick={toggleDataSource} variant="outline">
          Switch to {dataSource === 'firestore' ? 'Mock' : 'Live (Firestore)'} Data
        </Button>
      </div>

      {isLoading && <LoadingSpinner className="my-16" />}

      {error && !isLoading && (
        <div className="my-16 flex flex-col items-center gap-4">
          <ErrorMessage message={error} />
          <Button onClick={fetchAccounts} variant="outline">
             Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && allAccounts.length === 0 && (
         <div className="text-center text-muted-foreground py-10">
           <p className="text-xl">No accounts found for {dataSource === 'firestore' ? 'live' : 'mock'} source.</p>
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
              style={{ animationDelay: `${index * 50}ms` }}
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
