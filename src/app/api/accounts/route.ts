
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Account } from '@/types/account';
import * as admin from 'firebase-admin';

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
    // Initialize Firebase Admin SDK only if not using mock data
    if (!admin.apps.length) {
      try {
        // Attempt to initialize with default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
        admin.initializeApp();
      } catch (error) {
        console.error('Firebase admin default initialization error', error);
        // Fallback for environments where GOOGLE_APPLICATION_CREDENTIALS might not be set,
        // but FIREBASE_CONFIG (e.g., from Firebase Hosting/Functions) is.
        if (process.env.FIREBASE_CONFIG) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG))
            });
        } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== 'production') {
            // This warning is more relevant if we are *trying* to use Firestore
            console.warn("GOOGLE_APPLICATION_CREDENTIALS not set, and no FIREBASE_CONFIG found. Firestore calls will likely fail if not in a Firebase-hosted environment.");
            // If initialization fails and we're not in mock mode, it's a genuine issue for Firestore access.
            throw new Error("Firebase Admin SDK initialization failed.");
        } else {
          // If initialization fails for other reasons, re-throw.
          throw error;
        }
      }
    }

    const db = admin.firestore();
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
    console.error('Error processing request for accounts:', error);
    // Ensure a more generic error message if it's an initialization problem vs. data fetching
    const errorMessage = error.message.includes("Firebase Admin SDK initialization failed")
        ? "Server configuration error for Firebase."
        : `Failed to fetch accounts: ${error.message}`;

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
