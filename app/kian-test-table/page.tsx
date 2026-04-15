"use client";

import { useEffect, useState } from "react";
import { fetchRows, addRow, updateRow, deleteRow } from "./actions";

type Row = {
  id: number;
  created_at: string;
  product: string;
  quantity: number;
  alert_threshold: number;
  expiration_date: string | null;
};

export default function KianTestTablePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [alertThreshold, setAlertThreshold] = useState<number>(5);
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadRows() {
    try {
      const data = await fetchRows();
      data.sort((a: Row, b: Row) => {
        const ratioA = a.alert_threshold ? a.quantity / a.alert_threshold : Infinity;
        const ratioB = b.alert_threshold ? b.quantity / b.alert_threshold : Infinity;
        return ratioA - ratioB;
      });
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
        await updateRow(editingId, product, quantity, alertThreshold, expirationDate || null);
      } else {
        await addRow(product, quantity, alertThreshold, expirationDate || null);
      }
      setProduct("");
      setQuantity(1);
      setAlertThreshold(5);
      setExpirationDate("");
      setEditingId(null);
      loadRows();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteRow(id);
      loadRows();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Kian's Table Editor</h1>

        {/* Form */}
        <div className="mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Product</label>
            <input
              className="w-full rounded border px-3 py-2 text-gray-900"
              placeholder="Product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              className="w-32 rounded border px-3 py-2 text-gray-900"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Alert Threshold</label>
            <input
              type="number"
              className="w-32 rounded border px-3 py-2 text-gray-900"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Expiration Date</label>
            <input
              type="date"
              className="w-40 rounded border px-3 py-2 text-gray-900"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
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
              <tr className="bg-gray-800 text-white text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Created</th>
                <th className="p-2">Product</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Alert Threshold</th>
                <th className="p-2">Expiration Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-t ${row.quantity < row.alert_threshold ? "bg-red-100" : ""}`}>
                  <td className="p-2 text-gray-900">{row.id}</td>
                  <td className="p-2 text-sm text-gray-700">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="p-2 text-gray-900">{row.product}</td>
                  <td className="p-2 text-gray-900">{row.quantity}</td>
                  <td className="p-2 text-gray-900">{row.alert_threshold}</td>
                  <td className="p-2 text-gray-900">
                    {row.expiration_date ? new Date(row.expiration_date + "T00:00:00").toLocaleDateString() : "-"}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => {
                        setEditingId(row.id);
                        setProduct(row.product);
                        setQuantity(row.quantity);
                        setAlertThreshold(row.alert_threshold);
                        setExpirationDate(row.expiration_date || "");
                      }}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
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
