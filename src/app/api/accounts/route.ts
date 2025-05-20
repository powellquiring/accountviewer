
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Account } from '@/types/account';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
// Moved Firebase Admin SDK initialization logic inside the try block for Firestore access

const mockAccounts: Account[] = [
  { id: 'mock-1', accountName: 'Mock Savings', accountNumber: '**** **** **** 1111', balance: 1500.75, currency: 'USD', accountType: 'Savings' },
  { id: 'mock-2', accountName: 'Mock Checking', accountNumber: '**** **** **** 2222', balance: 320.50, currency: 'USD', accountType: 'Checking' },
  { id: 'mock-3', accountName: 'Mock Credit Card', accountNumber: '**** **** **** 3333', balance: -500.00, currency: 'EUR', accountType: 'Credit Card' },
  { id: 'mock-4', accountName: 'Mock Investment', accountNumber: '**** **** **** 4444', balance: 12500.00, currency: 'USD', accountType: 'Investment' },
];

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source');

  if (source === 'mock') {
    return NextResponse.json(mockAccounts);
  }

  try {
    // Initialize Firebase Client SDK
    const firebaseConfig = {
      apiKey: "AIzaSyAglV5rgoSjtpf0W5EY5qeVWO_T1-Z_FI0",
      authDomain: "accountviewer.firebaseapp.com",
      projectId: "accountviewer",
      storageBucket: "accountviewer.firebasestorage.app",
      messagingSenderId: "693621188843",
      appId: "1:693621188843:web:9d332a2bb0973d98bcb6ae"
    };
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);
    const accountsCollection = collection(db, 'accounts');
    const accountsSnapshot = await getDocs(accountsCollection);

    if (accountsSnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const accounts: Account[] = accountsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        accountName: data.accountName || 'N/A',
        accountNumber: data.accountNumber || '**** **** **** 0000',
        balance: typeof data.balance === 'number' ? data.balance : 0,
        currency: data.currency || 'USD',
        accountType: data.accountType || 'Checking',
      } as Account;
    });

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Error processing request for accounts:', error);
    // Ensure a more generic error message if it's an initialization problem vs. data fetching
    const errorMessage = error.message.includes("Firebase Client SDK initialization failed")
        ? "Client configuration error for Firebase."
        : `Failed to fetch accounts: ${error.message}`;

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}