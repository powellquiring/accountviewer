
import { NextResponse } from 'next/server';
import type { Account, Security } from '@/types/account';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, collection, getDocs } from 'firebase-admin/firestore';

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin(): App {
  const apps = getApps();
  if (apps.length) {
    return apps[0];
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return initializeApp({
        credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
      });
    } catch (e) {
       console.warn("Failed to parse GOOGLE_APPLICATION_CREDENTIALS as JSON, trying as path.", e);
       // Fallback for environments where it's a path
       return initializeApp({
         credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
       });
    }
  }
  
  const firebaseConfigEnv = process.env.FIREBASE_CONFIG;
  if (firebaseConfigEnv) {
    try {
      const firebaseConfig = JSON.parse(firebaseConfigEnv);
      return initializeApp({ credential: cert(firebaseConfig) });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_CONFIG, attempting default initialization.", e);
    }
  }
  
  // Fallback for environments like Cloud Functions / Cloud Run
  return initializeApp();
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');

  if (source === 'mock') {
    const mockSecurities: Security[] = [
      { description: 'Apple Inc.', quantity: 10, symbol: 'AAPL', unitcost: 150.00 }, // Changed unitCost to unitcost
      { description: 'Microsoft Corp.', quantity: 5, symbol: 'MSFT', unitcost: 280.50 }, // Changed unitCost to unitcost
    ];
    const mockAccounts: Account[] = [
      { id: 'mock-api-1', name: 'Mock API Brokerage', securities: mockSecurities },
      { id: 'mock-api-2', name: 'Mock API Retirement', securities: [{ description: 'Tesla Inc.', quantity: 2, symbol: 'TSLA', unitcost: 700.00 }] }, // Changed unitCost to unitcost
      { id: 'mock-api-3', name: 'Mock API Custodial' },
    ];
    return NextResponse.json(mockAccounts);
  }

  try {
    initializeFirebaseAdmin();
    const db = getFirestore();
    const accountsCollectionRef = collection(db, 'accounts');
    const accountsSnapshot = await getDocs(accountsCollectionRef);

    if (accountsSnapshot.empty) {
      return NextResponse.json([]);
    }

    const accounts: Account[] = accountsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Firestore data is assumed to have 'unitcost' if 'securities' array exists
      // No explicit mapping needed here as long as Firestore data matches the type
      return {
        id: doc.id,
        name: data.name || 'N/A',
        securities: data.securities || [], 
      };
    });

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Error fetching accounts from Firestore:', error);
    if (error.code === 'unavailable' || error.code === 'permission-denied' || error.code === 'unimplemented' || error.code === 'internal') {
         // Added 'unimplemented' for cases like Firestore not being enabled
         // Added 'internal' for other generic Firebase Admin SDK errors
         console.warn(`Firebase Admin SDK error: ${error.message}. This might be due to Firestore not being enabled or misconfiguration.`);
         return NextResponse.json({ message: 'Service temporarily unavailable or permission issue. Ensure Firestore is enabled and configured.' }, { status: 503 });
    }
    return NextResponse.json({ message: 'Failed to fetch accounts', error: error.message }, { status: 500 });
  }
}
