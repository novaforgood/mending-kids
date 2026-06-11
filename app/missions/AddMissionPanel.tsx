"use client";

import React, { useEffect, useState } from "react";
import Button from "@atlaskit/button/new";
import Form, { Field, FormFooter } from "@atlaskit/form";
import Textfield from "@atlaskit/textfield";
import { addMission, addMissionItem, addMissionMember, fetchInventory } from "./actions";
import { overlayStyle, popupStyle } from "./panelStyles";
import { useAuthUser } from "@/app/hooks/authUser";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: number) => void;
};

type FormValues = {
  mission_name: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string;
  location: string;
  doctor_name: string;
  doctor_email: string;
  doctor_phone: string;
  budget: string;
};


type InventoryItem = {
  id: number;
  item_description: string | null;
  manufacturer: string | null;
  quantity: number | null;
  unit_of_measure: string | null;
};

const CATEGORIES = ["Medical", "Dental", "Surgical", "Educational", "Other"];
const LOCATIONS = ["Guatemala", "Honduras", "Mexico", "El Salvador", "Nicaragua", "Other"];

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#172b4d",
  display: "block",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "2px solid #dfe1e6",
  borderRadius: 3,
  fontSize: 14,
  color: "#172b4d",
  backgroundColor: "#fafbfc",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b778c'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  cursor: "pointer",
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={labelStyle}>
      {children}
      {required && <span style={{ color: "#de350b", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function NativeSelect({ name, options, required }: { name: string; options: string[]; required?: boolean }) {
  return (
    <Field<string> name={name} defaultValue="" isRequired={required}>
      {({ fieldProps: { onChange, value, isDisabled, isInvalid, isRequired, ...rest } }) => (
        <select {...rest} value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
    </Field>
  );
}

export default function AddMissionPanel({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<"details" | "inventory" | "preview">("details");
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, number>>({}); // id → quantity
  const [saving, setSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
const [showPopup, setShowPopup] = useState(false);
const { user } = useAuthUser();

  // Reset all state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setStep("details");
      setPendingValues(null);
      setInventory([]);
      setSearch("");
      setSelected({});
    }
  }, [isOpen]);

  // ── Step 1: collect form values, move to step 2 ──────────────────────────
  const handleStep1 = (values: FormValues) => {
    setPendingValues(values);
    setStep("inventory");
    fetchInventory().then(setInventory).catch(console.error);
  };

  // ── Step 2: create mission + optional items, then close ───────────────────
  const handleFinish = async (skipItems: boolean) => {
  if (!pendingValues) return;
  setSaving(true);

 if (user?.user_metadata?.role !== "admin") {
  setPopupMessage("You do not have permission to add items.");
  setShowPopup(true);
  setSaving(false);
  return;
}

    try {
      const created = await addMission({
        mission_name: pendingValues.mission_name,
        description: pendingValues.description || null,
        start_date: pendingValues.start_date || null,
        end_date: pendingValues.end_date || null,
        category: pendingValues.category || null,
        location: pendingValues.location || null,
        doctor_name: pendingValues.doctor_name || null,
        doctor_email: pendingValues.doctor_email || null,
        doctor_phone: pendingValues.doctor_phone || null,
        budget: pendingValues.budget ? parseInt(pendingValues.budget) : null,
        status: "planned",
      });

      if (created?.id && pendingValues.doctor_name) {
        await addMissionMember({
          mission_id: created.id,
          name: pendingValues.doctor_name,
          contact: pendingValues.doctor_email || pendingValues.doctor_phone || null,
          role: "Lead Doctor",
          form_filled: false,
        });
      }

      if (!skipItems && created?.id) {
        await Promise.all(
          Object.entries(selected).map(([inventoryId, qty]) =>
            addMissionItem({
              mission_id: created.id,
              inventory_id: Number(inventoryId),
              quantity: qty,
            })
          )
        );
      }

      if (created?.id && onCreated) onCreated(created.id);
      onClose();
    } catch (err: any) {
  setPopupMessage(err.message || "You do not have permission to add items.");
  setShowPopup(true);
} finally {
      setSaving(false);
    }
  };

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      if (id in prev) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id: number, qty: number) => {
    setSelected((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const filteredInventory = inventory.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.item_description?.toLowerCase().includes(q) ||
      item.manufacturer?.toLowerCase().includes(q)
    );
  });

  const selectedCount = Object.keys(selected).length;

  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(9,30,66,0.54)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 220ms ease",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: 480,
          background: "#fff",
          boxShadow: "-4px 0 16px rgba(0,0,0,0.15)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.2,0,0,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "32px 32px 32px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* ── STEP 1: Mission details ── */}
        {step === "details" && (
          <>
            <div style={{ flexShrink: 0, paddingBottom: 12, borderBottom: "1px solid #e4e6ea", paddingRight: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#172b4d" }}>New Mission</h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b778c" }}>* indicates a required field</p>
            </div>

            <Form<FormValues> onSubmit={handleStep1}>
              {({ formProps, submitting }) => (
                <form {...formProps} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "16px 16px 16px 0" }}>
                    <div>
                      <Label required>Name</Label>
                      <Field<string> name="mission_name" defaultValue="" isRequired>
                        {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Mission Name" />}
                      </Field>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Field<string> name="description" defaultValue="">
                        {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Description" />}
                      </Field>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <Label required>Start Date</Label>
                        <Field<string> name="start_date" defaultValue="" isRequired>
                          {({ fieldProps }) => <Textfield {...fieldProps} type="date" />}
                        </Field>
                      </div>
                      <div>
                        <Label required>Category</Label>
                        <NativeSelect name="category" options={CATEGORIES} required />
                      </div>
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Field<string> name="end_date" defaultValue="">
                        {({ fieldProps }) => <Textfield {...fieldProps} type="date" />}
                      </Field>
                    </div>

                    <div>
                      <Label required>Location</Label>
                      <NativeSelect name="location" options={LOCATIONS} required />
                    </div>

                    <div>
                      <Label required>Doctor Name</Label>
                      <Field<string> name="doctor_name" defaultValue="" isRequired>
                        {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Doctor Name" />}
                      </Field>
                    </div>

                    <div>
                      <Label required>Doctor's Email</Label>
                      <Field<string> name="doctor_email" defaultValue="" isRequired>
                        {({ fieldProps }) => <Textfield {...fieldProps} type="email" placeholder="doctor@example.com" />}
                      </Field>
                    </div>

                    <div>
                      <Label>Doctor's Phone</Label>
                      <Field<string> name="doctor_phone" defaultValue="">
                        {({ fieldProps }) => <Textfield {...fieldProps} type="tel" placeholder="555-555-5555" />}
                      </Field>
                    </div>


                    <div>
                      <Label>Budget</Label>
                      <Field<string> name="budget" defaultValue="">
                        {({ fieldProps }) => (
                          <Textfield
                            {...fieldProps}
                            type="number"
                            placeholder="0"
                            elemBeforeInput={
                              <span style={{ paddingLeft: 8, color: "#6b778c", fontWeight: 600, fontSize: 14 }}>$</span>
                            }
                          />
                        )}
                      </Field>
                    </div>

                    <p style={{ fontSize: 13, color: "#6b778c", margin: 0 }}>
                      Documents can be added from the mission page once the mission has been created.
                    </p>
                  </div>

                  <FormFooter>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderTop: "1px solid #e4e6ea", paddingTop: 12, paddingRight: 16, flexShrink: 0 }}>
                      <Button appearance="subtle" onClick={onClose}>Cancel</Button>
                      <Button type="submit" appearance="primary" isLoading={submitting}>Next →</Button>
                    </div>
                  </FormFooter>
                </form>
              )}
            </Form>
          </>
        )}

        {/* ── STEP 2: Inventory selection ── */}
        {step === "inventory" && (
          <>
            {/* Header */}
            <div style={{ flexShrink: 0, paddingBottom: 12, borderBottom: "1px solid #e4e6ea", paddingRight: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#172b4d" }}>Add Items</h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b778c" }}>
                Choose from items in current inventory to add to this mission
              </p>
            </div>

            {/* Search */}
            <div style={{ flexShrink: 0, padding: "12px 16px 0 0" }}>
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #dfe1e6",
                  borderRadius: 3,
                  fontSize: 14,
                  color: "#172b4d",
                  backgroundColor: "#fafbfc",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: "auto", marginTop: 12, paddingRight: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f4f5f7", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", width: 32, color: "#6b778c", fontWeight: 600 }} />
                    <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600 }}>Item Description</th>
                    <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600 }}>Manufacturer</th>
                    <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600, whiteSpace: "nowrap" }}>Avail. Qty</th>
                    <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600, whiteSpace: "nowrap" }}>Qty to Add</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#6b778c" }}>
                        {inventory.length === 0 ? "Loading…" : "No items match your search"}
                      </td>
                    </tr>
                  )}
                  {filteredInventory.map((item) => {
                    const isChecked = item.id in selected;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderTop: "1px solid #f0f0f0",
                          backgroundColor: isChecked ? "#e8f0fe" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleItem(item.id)}
                      >
                        <td style={{ padding: "8px 10px" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "8px 10px", color: "#172b4d" }}>
                          {item.item_description ?? "—"}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#42526e" }}>
                          {item.manufacturer ?? "—"}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#42526e" }}>
                          {item.quantity != null ? `${item.quantity}${item.unit_of_measure ? ` ${item.unit_of_measure}` : ""}` : "—"}
                        </td>
                        <td style={{ padding: "8px 4px" }} onClick={(e) => e.stopPropagation()}>
                          {isChecked && (
                            <input
                              type="number"
                              min={1}
                              value={selected[item.id]}
                              onChange={(e) => setQty(item.id, parseInt(e.target.value) || 1)}
                              style={{
                                width: 60,
                                padding: "4px 6px",
                                border: "2px solid #0052cc",
                                borderRadius: 3,
                                fontSize: 13,
                                color: "#172b4d",
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #e4e6ea",
                paddingTop: 12,
                paddingRight: 16,
                marginTop: 12,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <Button appearance="subtle" onClick={onClose} isDisabled={saving}>Cancel</Button>
                <Button appearance="subtle" onClick={() => setStep("details")} isDisabled={saving}>← Back</Button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button appearance="subtle" onClick={() => handleFinish(true)} isLoading={saving}>Skip</Button>
                <Button
                  appearance="primary"
                  onClick={() => setStep("preview")}
                  isDisabled={selectedCount === 0}
                >
                  Add {selectedCount > 0 ? `${selectedCount} Item${selectedCount > 1 ? "s" : ""}` : "Items"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === "preview" && pendingValues && (() => {
          const selectedItems = inventory
            .filter((item) => item.id in selected)
            .map((item) => ({ ...item, qty: selected[item.id] }));

          const formatDate = (iso: string) => {
            if (!iso) return null;
            const [y, m, d] = iso.split("-");
            return `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}`;
          };

          const startFmt = formatDate(pendingValues.start_date);
          const endFmt = formatDate(pendingValues.end_date);
          const dateRange = [startFmt, endFmt].filter(Boolean).join(" – ");

          const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
            Medical:    { bg: "#e3fcef", color: "#006644" },
            Dental:     { bg: "#e6f0ff", color: "#0052cc" },
            Surgical:   { bg: "#fff0b3", color: "#974900" },
            Educational:{ bg: "#f3f0ff", color: "#403294" },
            Other:      { bg: "#f4f5f7", color: "#42526e" },
          };
          const categoryStyle = CATEGORY_COLORS[pendingValues.category] ?? CATEGORY_COLORS.Other;

          return (
            <>
              {/* Header */}
              <div style={{ flexShrink: 0, paddingBottom: 16, borderBottom: "1px solid #e4e6ea", paddingRight: 16 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#172b4d" }}>
                  {pendingValues.mission_name}
                </h2>
              </div>

              {/* Mission meta */}
              <div style={{ flexShrink: 0, paddingRight: 16, paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {pendingValues.location && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b778c", textTransform: "uppercase", letterSpacing: "0.04em" }}>Location</span>
                    <p style={{ margin: "2px 0 0", fontSize: 14, color: "#172b4d" }}>{pendingValues.location}</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 32 }}>
                  {dateRange && (
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6b778c", textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</span>
                      <p style={{ margin: "2px 0 0", fontSize: 14, color: "#172b4d" }}>{dateRange}</p>
                    </div>
                  )}
                  {pendingValues.category && (
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6b778c", textTransform: "uppercase", letterSpacing: "0.04em" }}>Category</span>
                      <div style={{ marginTop: 4 }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: categoryStyle.bg,
                          color: categoryStyle.color,
                        }}>
                          {pendingValues.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected items table */}
              <div style={{ marginTop: 20, flexShrink: 0, paddingRight: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b778c", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Selected Items
                </span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f4f5f7", textAlign: "left" }}>
                      <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600 }}>Quantity</th>
                      <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600 }}>Item Description</th>
                      <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600 }}>Manufacturer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => (
                      <tr key={item.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 12,
                            backgroundColor: "#f4f5f7",
                            color: "#172b4d",
                            fontWeight: 600,
                            fontSize: 13,
                          }}>
                            {item.qty}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", color: "#172b4d" }}>{item.item_description ?? "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#42526e" }}>{item.manufacturer ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{
                flexShrink: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #e4e6ea",
                paddingTop: 12,
                paddingRight: 16,
                marginTop: 12,
              }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button appearance="subtle" onClick={onClose} isDisabled={saving}>Cancel</Button>
                  <Button appearance="subtle" onClick={() => setStep("inventory")} isDisabled={saving}>← Back</Button>
                </div>
                <Button appearance="primary" onClick={() => handleFinish(false)} isLoading={saving}>
                  Create Mission
                </Button>
              </div>
            </>
          );
        })()}
      </div>
      {showPopup && (
  <div style={overlayStyle}>
    <div style={popupStyle}>
      <p>{popupMessage}</p>
      <button onClick={() => setShowPopup(false)}>OK</button>
    </div>
  </div>
)}
    </>
  );
}
