
export interface Security {
  stock: boolean;
  description: string;
  quantity: number;
  symbol: string;
  unitcost: number; // Changed from unitCost to unitcost
}

export interface Account {
  id: string;
  name: string;
  securities?: Security[]; // Optional, as an account might not have securities
}

export interface User {
  id: string;
  hairColor: string;
  accounts: Account[];
}
