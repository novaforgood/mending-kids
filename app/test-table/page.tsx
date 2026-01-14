"use client";

import { useEffect, useState } from "react";
import { fetchRows, addRow, updateRow } from "./actions";

type Row = {
  id: number;
  created_at: string;
  product: string;
  quantity: number;
};

export default function TestTablePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadRows() {
    try {
      const data = await fetchRows();
      setRows(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  async function handleSubmit() {
    if (!product) return;
    try {
      if (editingId) {
        await updateRow(editingId, product, quantity);
      } else {
        await addRow(product, quantity);
      }
      setProduct("");
      setQuantity(1);
      setEditingId(null);
      loadRows();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold">Test Table</h1>

        {/* Form */}
        <div className="mb-6 flex gap-3">
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="Product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <input
            type="number"
            className="w-32 rounded border px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Created</th>
                <th className="p-2">Product</th>
                <th className="p-2">Qty</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.id}</td>
                  <td className="p-2 text-sm text-gray-500">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{row.product}</td>
                  <td className="p-2">{row.quantity}</td>
                  <td className="p-2">
                    <button
                      onClick={() => {
                        setEditingId(row.id);
                        setProduct(row.product);
                        setQuantity(row.quantity);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No rows yet
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
