export type InventoryItem = {
  id: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  item_description: string;
  manufacturer: string;
  reference_number: string;
  lot_number: string | null;
  unit_of_measure: string | null;
  typical_shelf_life: string | null;
  location: string | null;
  quantity: number;
  initial_quantity?: number | null;
  status: string;
  mission: string;
  expiration: Date | null;
  mission_inventory?: {
    mission_id: number;
    quantity_used: number | null;
    missions?: {
      mission_name: string | null;
    };
  }[] | null;
  internal_notes: string | null;
  market_value_per_unit: number;
  total_value: number;
  valuation_source: string | null;
  value_researched_date: string | null;
  acquisition_method: string | null;
  documents: {
    id: string;
    name: string;
    type: string;
    uploaded_by: string;
    created_at: string;
    url?: string;
  }[] | null;
  active: boolean;
};

export interface ActivityEntry {
  id: number;
  action_type: string;
  quantity: number | null;
  description: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface DocumentEntry {
  id: string;
  name: string;
  type: string;
  uploaded_by: string;
  created_at: string;
  url?: string;
}

export type DocumentUploadPayload = {
  name: string;
  mimeType: string;
  base64: string;
};

export interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  setItems?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onAssignToMission?: () => void;
  onAddDocumentation?: () => void;
}

export interface State {
  isEditing: boolean;
  selectedTab: "Overview" | "Activity" | "Documentation" | "Details";
  activity: ActivityRow[];
  form: ItemForm;
}

export type InventoryPayload = {
  item_description: string;
  manufacturer: string;
  reference_number: string;
  lot_number: string;
  unit_of_measure: string;
  typical_shelf_life: string;
  location: string;
  quantity: number;
  status: string;
  mission: string;
  expiration: Date | null;
  market_value_per_unit: number;
  valuation_source: string;
  acquisition_method: string;
  document?: DocumentUploadPayload;
};

export type ChangeType = "added" | "edited" | "deleted" | "archived";

export type UpdateItemDetailsPayload = Partial<{
  manufacturer: string;
  reference_number: string;
  lot_number: string;
  unit_of_measure: string;
  typical_shelf_life: string;
  location: string;
  internal_notes: string;
  active: boolean;
}>;

export type ItemForm = {
  manufacturer: string;
  reference_number: string;
  lot_number: string;
  unit_of_measure: string;
  typical_shelf_life: string;
  location: string;
  internal_notes: string;
};

export type ActivityRow = {
  key: string;
  activity: string;
  quantity: string;
  reason: string;
  user: string;
  timestamp: string;
};