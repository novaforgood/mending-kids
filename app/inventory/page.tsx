"use client";

import { useEffect, useState } from "react";
import { fetchInventory, addItem, deleteItem } from "./actions";

type InventoryItem = {
  id: number;
  created_at: string;
  manufacturer: string;
  reference_number: string;
  quantity: number;
  unit: string;
  lot_number: string;
  date_value_researched: string;
  market_value_per_unit: number;
  total_value: number;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [manufacturer, setManufacturer] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState("");
  const [marketValue, setMarketValue] = useState<number>(0);

  async function loadInventory() {
    const data = await fetchInventory();
    setItems(data);
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function handleSubmit() {
    if (!manufacturer || !referenceNumber) return;

    await addItem({
      manufacturer,
      reference_number: referenceNumber,
      quantity,
      unit,
      market_value_per_unit: marketValue,
    });

    setManufacturer("");
    setReferenceNumber("");
    setQuantity(0);
    setUnit("");
    setMarketValue(0);

    loadInventory();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold">Inventory</h1>

        {/* Form */}
        <div className="mb-6 grid grid-cols-5 gap-3">
          <input
            className="rounded border px-3 py-2"
            placeholder="Manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Reference #"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
          <input
            type="number"
            className="rounded border px-3 py-2"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <input
            type="number"
            className="rounded border px-3 py-2"
            placeholder="Value / Unit"
            value={marketValue}
            onChange={(e) => setMarketValue(Number(e.target.value))}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mb-6 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Add Item
        </button>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Manufacturer</th>
                <th className="p-2">Ref #</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Value / Unit</th>
                <th className="p-2">Total</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.manufacturer}</td>
                  <td className="p-2">{item.reference_number}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">{item.unit}</td>
                  <td className="p-2">${item.market_value_per_unit}</td>
                  <td className="p-2 font-medium">${item.total_value}</td>
                  <td className="p-2">
                    <button
                      className="text-red-600 hover:underline"
                      onClick={async () => {
                        await deleteItem(item.id);
                        loadInventory();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No inventory items yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
