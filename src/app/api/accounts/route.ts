import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Account } from '@/types/account';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This needs to be done once, typically at the application start.
// In a Next.js API route (serverless environment), initializing here is common.
// Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set for local development,
// pointing to your service account key file. In Firebase deployed environments (e.g., Cloud Functions),
// initialization is often automatic or requires minimal configuration.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export async function GET(request: NextRequest) {
  try {
    const accountsCollection = db.collection('accounts');
    const accountsSnapshot = await accountsCollection.get();

    if (accountsSnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const accounts: Account[] = accountsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure data conforms to the Account type, add validation if necessary
      return {
        id: doc.id,
        accountName: data.accountName || 'N/A',
        accountNumber: data.accountNumber || '**** **** **** 0000',
        balance: typeof data.balance === 'number' ? data.balance : 0,
        currency: data.currency || 'USD',
        accountType: data.accountType || 'Checking', // Provide a default or ensure data consistency
      } as Account;
    });

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Error fetching accounts from Firestore:', error);
    // The PRD mentions "console.firebase.google.com" for error source,
    // which likely means "Firebase backend services" like Firestore.
    return NextResponse.json(
      { error: `Failed to fetch accounts from Firebase services: ${error.message}` },
      { status: 500 }
    );
  }
}
