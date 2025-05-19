
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Account } from '@/types/account';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    // Fallback for environments where GOOGLE_APPLICATION_CREDENTIALS might not be set,
    // though this is primarily for deployed environments.
    // For local dev, ensure GOOGLE_APPLICATION_CREDENTIALS is set.
    if (process.env.FIREBASE_CONFIG) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG))
        });
    } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== 'production') {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS not set. Firestore calls will likely fail if not in a Firebase environment.");
    }
  }
}

const db = admin.firestore();

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
    const accountsCollection = db.collection('accounts');
    const accountsSnapshot = await accountsCollection.get();

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
    console.error('Error fetching accounts from Firestore:', error);
    return NextResponse.json(
      { error: `Failed to fetch accounts from Firebase services: ${error.message}` },
      { status: 500 }
    );
  }
}
