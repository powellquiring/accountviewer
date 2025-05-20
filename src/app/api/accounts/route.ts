import { NextResponse } from 'next/server';
import type { Account } from '@/types/account';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin(): App {
  const apps = getApps();
  if (apps.length) {
    return apps[0];
  }

  // Try to initialize with service account credentials if available (local dev)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
  }
  
  // Try to initialize with Firebase config (for Firebase Hosting/Functions environment)
  const firebaseConfigEnv = process.env.FIREBASE_CONFIG;
  if (firebaseConfigEnv) {
    try {
      const firebaseConfig = JSON.parse(firebaseConfigEnv);
      return initializeApp({ credential: cert(firebaseConfig) });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_CONFIG, attempting default initialization.", e);
    }
  }
  
  // Default initialization (relies on Application Default Credentials in GCP environments)
  return initializeApp();
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');

  if (source === 'mock') {
    const mockAccounts: Account[] = [
      { id: 'mock-api-1', name: 'Mock API Savings' },
      { id: 'mock-api-2', name: 'Mock API Checking' },
      { id: 'mock-api-3', name: 'Mock API Credit Card' },
    ];
    return NextResponse.json(mockAccounts);
  }

  try {
    initializeFirebaseAdmin();
    const db = getFirestore();
    const accountsCollection = collection(db, 'accounts');
    const accountsSnapshot = await getDocs(accountsCollection);

    if (accountsSnapshot.empty) {
      return NextResponse.json([]);
    }

    const accounts: Account[] = accountsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'N/A', // Assuming 'name' is the field in Firestore
      };
    });

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Error fetching accounts from Firestore:', error);
    // Check for specific Firebase errors if needed
    if (error.code === 'unavailable' || error.code === 'permission-denied') {
         return NextResponse.json({ message: 'Service temporarily unavailable or permission issue.' }, { status: 503 });
    }
    return NextResponse.json({ message: 'Failed to fetch accounts', error: error.message }, { status: 500 });
  }
}
