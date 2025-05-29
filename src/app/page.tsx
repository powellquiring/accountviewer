
"use client";

import type { Account, Security } from '@/types/account';
import { useEffect, useState, useCallback } from 'react';
import { AccountCard } from '@/components/account-card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Button } from '@/components/ui/button';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, signInWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Moved firebaseConfig outside the component
const firebaseConfig = {
  apiKey: "AIzaSyAglV5rgoSjtpf0W5EY5qeVWO_T1-Z_FI0",
  authDomain: "accountviewer.firebaseapp.com",
  projectId: "accountviewer",
  storageBucket: "accountviewer.firebasestorage.app",
  messagingSenderId: "693621188843",
  appId: "1:693621188843:web:9d332a2bb0973d98bcb6ae"
};

export default function HomePage() {
  // State declarations
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [renderedAccounts, setRenderedAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'firestore' | 'mock'>('firestore');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState<boolean>(false);
  const [userJson, setUserJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const { toast } = useToast();
      
  // Set isMounted to true when component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Firebase initialization and auth state monitoring
  useEffect(() => {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase auth initialization error:", error);
      setAuthLoading(false);
    }
  }, []); 

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRenderedAccounts([]);
    setAllAccounts([]);
    
    try {
      if (dataSource === 'mock') {
        const mockSecurities: Security[] = [
          { description: 'Alphabet Inc.', quantity: 15, symbol: 'GOOGL', unitcost: 2500.00, stock: true },
          { description: 'Amazon.com Inc.', quantity: 3, symbol: 'AMZN', unitcost: 3200.75, stock: true },
        ];
        const mockAccountsData: Account[] = [
          { id: 'mock-page-1', name: 'Mock Brokerage Account', securities: mockSecurities },
          { id: 'mock-page-2', name: 'Mock Savings Account' }, 
          { id: 'mock-page-3', name: 'Mock Investment Portfolio', securities: [{ description: 'Netflix Inc.', quantity: 7, symbol: 'NFLX', unitcost: 550.20, stock: true }] },
          { id: 'mock-page-4', name: 'Mock College Fund' },
        ];
        setAllAccounts(mockAccountsData);
      } else {
        if (!user) {
          setAllAccounts([]);
          setError('Please sign in to view your accounts');
          return;
        }
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setAllAccounts([]);
          return;
        }

        const userData = userDoc.data();
        const accountsData: Account[] = [];
        
        if (userData.accounts && Array.isArray(userData.accounts)) {
          userData.accounts.forEach((account: any) => {
            accountsData.push({
              id: account.id || `${user.uid}-${accountsData.length}`,
              name: account.name || 'N/A',
              securities: (account.securities || []).map((s: any) => ({...s, unitcost: s.unitcost || 0, quantity: s.quantity || 0})),
            });
          });
        }
        
        setAllAccounts(accountsData);
      }
    } catch (e: any) {
      console.error("Failed to fetch accounts:", e);
      setError(e.message || 'Could not load accounts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [dataSource, user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (allAccounts.length > 0 && renderedAccounts.length < allAccounts.length) {
      const timer = setTimeout(() => {
        setRenderedAccounts(prev => [...prev, allAccounts[prev.length]]);
      }, 100); // Reduced progressive rendering delay
      return () => clearTimeout(timer);
    }
  }, [allAccounts, renderedAccounts]);

  const toggleDataSource = () => {
    setDataSource(prev => prev === 'firestore' ? 'mock' : 'firestore');
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoginOpen(false);
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Failed to login");
    }
  };

  const handleLogout = async () => {
    try {
      const app = getApps()[0];
      const auth = getAuth(app);
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleJsonSubmit = async () => {
    setJsonError(null);
    try {
      const userData = JSON.parse(userJson);
      if (!user) {
        throw new Error("You must be signed in to update user data");
      }
      const app = getApps()[0];
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, userData, { merge: true });
      setIsJsonDialogOpen(false);
      toast({
        title: "Success",
        description: "User data updated successfully",
      });
      fetchAccounts();
    } catch (error: any) {
      console.error("JSON update error:", error);
      setJsonError(error.message || "Invalid JSON or update failed");
    }
  };

  const getCombinedSecurities = useCallback((): Security[] => {
    if (!allAccounts.length) return [];
    const securitiesMap = new Map<string, Security>();
    allAccounts.forEach(account => {
      if (!account.securities) return;
      account.securities.forEach(security => {
        if (!security.stock) return;
        const existing = securitiesMap.get(security.symbol);
        if (existing) {
          const totalQuantity = existing.quantity + security.quantity;
          const totalCost = (existing.quantity * existing.unitcost) + (security.quantity * security.unitcost);
          securitiesMap.set(security.symbol, {
            symbol: security.symbol,
            description: security.description,
            quantity: totalQuantity,
            unitcost: totalCost / totalQuantity,
            stock: security.stock,
          });
        } else {
          securitiesMap.set(security.symbol, {...security});
        }
      });
    });
    return Array.from(securitiesMap.values());
  }, [allAccounts]);

  const fetchMarketPrices = async () => {
    const securities = getCombinedSecurities();
    if (!securities.length) return;
    
    setIsLoadingPrices(true);
    setPriceError(null);
    
    try {
      const symbols = securities.map(security => security.symbol);
      const app = getApps()[0];
      const functions = getFunctions(app);
      // connectFunctionsEmulator(functions, "localhost", 5001);
      const getMarketValuesFunction = httpsCallable(functions, 'getMarketValues');
      const result = await getMarketValuesFunction({ symbols: symbols });
      const data = result.data as any;
      const prices: Record<string, number> = {};
      if (data && data.length > 0 && data[0].values) {
        const symbolValue = data[0].values as Record<string, number>;
        Object.entries(symbolValue).forEach(([key, value]) => {
          prices[key] = value;
        });
      }
      setMarketPrices(prices);
      toast({
        title: "Prices Updated",
        description: "Market prices have been refreshed",
      });
    } catch (error: any) {
      console.error("Failed to fetch market prices:", error);
      setPriceError(error.message || "Could not load market prices");
    } finally {
      setIsLoadingPrices(false);
    }
  };

  return (
    <main className="min-h-screen container mx-auto px-2 py-1">
      <TooltipProvider>
        {isMounted && (
          <div className="mt-1 mb-1">
            {authLoading ? (
              <Badge variant="outline" className="animate-pulse">
                Checking auth...
              </Badge>
            ) : user ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleLogout} className="h-auto py-[2px] px-3 text-xs">
                        Sign Out
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.email || user.displayName || 'User'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button variant="outline" onClick={() => setIsJsonDialogOpen(true)} className="h-auto py-[2px] px-3 text-xs">
                    User JSON
                  </Button>
                  <Button 
                    onClick={fetchMarketPrices} 
                    disabled={isLoadingPrices || !getCombinedSecurities().length}
                    variant="outline"
                    className="h-auto py-[2px] px-3 text-xs"
                  >
                    {isLoadingPrices ? (
                      <>
                        <LoadingSpinner size={16} className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      "Update Prices"
                    )}
                  </Button>
                  <Button onClick={toggleDataSource} variant="outline" className="h-auto py-[2px] px-3 text-xs">
                    {dataSource === 'firestore' ? 'Mock' : 'Live (Firestore)'} Data
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Badge variant="secondary">
                  Not signed in
                </Badge>
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="h-auto py-[2px] px-3 text-xs">
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Sign in to AccountViewer</DialogTitle>
                      <DialogDescription>
                        Enter your credentials to access your account information.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                      <div className="grid gap-2 py-2">
                        {loginError && (
                          <div className="text-sm text-destructive">{loginError}</div>
                        )}
                        <div className="grid gap-1">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            autoComplete="username"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                          />
                        </div>
                        <Button type="submit" className="mt-2 h-auto py-[2px] px-3 text-xs">
                          Sign In
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}
      </TooltipProvider>

      {!isLoading && !error && allAccounts.length > 0 && renderedAccounts.length > 0 && (
        <div className="mb-1">
          {priceError && (
            <div className="mb-1">
              <ErrorMessage message={priceError} />
            </div>
          )}
          <AccountCard key="combined-holdings" account={{ id: "combined-holdings", name: "Combined", securities: getCombinedSecurities() }} marketPrices={marketPrices} className="animate-in fade-in slide-in-from-bottom-5 duration-500" />
        </div>
      )}
      

      {isLoading && <LoadingSpinner className="my-4" />}

      {error && !isLoading && (
        <div className="my-4 flex flex-col items-center gap-2">
          <ErrorMessage message={error} />
          <Button onClick={fetchAccounts} variant="outline" className="h-auto py-[2px] px-3 text-xs">
             Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && allAccounts.length === 0 && (
         <div className="text-center text-muted-foreground py-3">
           <p className="text-lg">No accounts found for {dataSource === 'firestore' ? 'live' : 'mock'} source.</p>
           <p className="text-sm">Try adding some accounts or check back later.</p>
         </div>
      )}

      {!isLoading && !error && renderedAccounts.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {renderedAccounts.map((account, index) => (
            <AccountCard
              key={account.id}
              account={account}
              marketPrices={marketPrices}
              className="animate-in fade-in slide-in-from-bottom-5 duration-500 ease-out"
              style={{ animationDelay: `${index * 50}ms` }}
            />
          ))}
        </div>
      )}
      {!isLoading && !error && allAccounts.length > 0 && renderedAccounts.length < allAccounts.length && (
        <div className="mt-2 flex justify-center items-center">
          <LoadingSpinner size={20} />
          <p className="ml-2 text-sm text-muted-foreground">Loading more accounts...</p>
        </div>
      )}
      
      <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Data</DialogTitle>
            <DialogDescription>
              Enter JSON for your user document. This will update or create the document in Firestore.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            {jsonError && (
              <div className="text-sm text-destructive">{jsonError}</div>
            )}
            <div className="grid gap-1">
              <Label htmlFor="userJson">User data</Label>
              <Textarea
                id="userJson"
                value={userJson}
                onChange={(e) => setUserJson(e.target.value)}
                placeholder='{"accounts": [{"id": "account1", "name": "My Account", "securities": [{"description": "Apple Inc.", "quantity": 10, "symbol": "AAPL", "unitcost": 150.00, "stock": true}]}]}'
                className="min-h-[150px] font-mono text-xs"
              />
            </div>
            <Button onClick={handleJsonSubmit} className="h-auto py-[2px] px-3 text-xs">
              Update User Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

    