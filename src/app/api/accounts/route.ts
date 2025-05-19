import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Account } from '@/types/account';

const mockAccounts: Account[] = [
  {
    id: '1',
    accountName: 'Personal Savings',
    accountNumber: '**** **** **** 1234',
    balance: 10500.75,
    currency: 'USD',
    accountType: 'Savings',
  },
  {
    id: '2',
    accountName: 'Main Checking Account',
    accountNumber: '**** **** **** 5678',
    balance: 2345.22,
    currency: 'USD',
    accountType: 'Checking',
  },
  {
    id: '3',
    accountName: 'Travel Rewards Card',
    accountNumber: '**** **** **** 9012',
    balance: -750.00,
    currency: 'USD',
    accountType: 'Credit Card',
  },
  {
    id: '4',
    accountName: 'Retirement Fund',
    accountNumber: '**** **** **** 3456',
    balance: 150200.00,
    currency: 'USD',
    accountType: 'Investment',
  },
  {
    id: '5',
    accountName: 'Emergency Fund',
    accountNumber: '**** **** **** 7890',
    balance: 25000.00,
    currency: 'USD',
    accountType: 'Savings',
  },
  {
    id: '6',
    accountName: 'Euro Trip Account',
    accountNumber: '**** **** **** 1121',
    balance: 850.50,
    currency: 'EUR',
    accountType: 'Checking',
  }
];

export async function GET(request: NextRequest) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Uncomment to simulate potential error
  // if (Math.random() > 0.8) {
  //   console.error("Simulated server error fetching accounts");
  //   return NextResponse.json({ error: 'Failed to fetch accounts from the server.' }, { status: 500 });
  // }

  return NextResponse.json(mockAccounts);
}
