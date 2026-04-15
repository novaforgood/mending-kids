export type InventoryItem = {
  id: number;
  created_at: string;
  item_description: string;
  manufacturer: string;
  reference_number: string;
  lot_number: string | null;
  unit_of_measure: string | null;
  typical_shelf_life: string | null;
  location: string | null;
  quantity: number;
  status: string;
  mission: string;
  expiration: Date;
  market_value_per_unit: number;
  total_value: number;
  valuation_source: string | null;
  acquisition_method: string | null;
};