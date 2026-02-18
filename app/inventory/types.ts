export type InventoryItem = {
  id: number;
  created_at: string;
  item_description: string;
  manufacturer: string;
  reference_number: string;
  quantity: number;
  status: string;
  mission: string;
  expiration: Date;
  market_value_per_unit: number;
  total_value: number;
};