
export interface Security {
  description: string;
  quantity: number;
  symbol: string;
  unitCost: number;
}

export interface Account {
  id: string;
  name: string;
  securities?: Security[]; // Optional, as an account might not have securities
}
