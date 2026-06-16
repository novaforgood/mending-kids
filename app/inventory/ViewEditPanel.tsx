"use client";

import React from "react";
import CustomLozenge from "./components/custom-lozenge";
import SectionMessage from "@atlaskit/section-message";
import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import CustomButton from "./components/custom-button";
import CustomInlineEdit from "./components/CustomInlineEdit";
import { SwappedPageHeader } from "./components/swapped-page-header";
import ScrollablePaginatedTable from "./components/scrollable-table";
import { SidePanel } from "./components/SidePanel";
import { fetchItemActivityLog, updateItemDetails, addItemQuantity, fetchInventoryEntries } from "./utils/actions";
import AddQuantityModal from "./components/AddQuantityModal";

import AddIcon from "@atlaskit/icon/core/add";
import GlobeIcon from "@atlaskit/icon/core/globe";
import EditIcon from "@atlaskit/icon/core/edit";

import { State, Props, ActivityEntry, ActivityRow, DocumentEntry, UpdateItemDetailsPayload } from "./utils/types";

interface InventoryEntry {
  id: number;
  inventory_id: number;
  quantity_added: number;
  notes: string | null;
  added_by: string | null;
  date_added: string;
}

export default class ViewEditPanel extends React.Component<Props, State & { isAddQuantityOpen: boolean; inventoryEntries: InventoryEntry[] }> {
  state = {
    isEditing: false,
    selectedTab: "Overview" as State["selectedTab"],
    activity: [] as ActivityRow[],
    inventoryEntries: [] as InventoryEntry[],
    isAddQuantityOpen: false,
    form: {
      manufacturer: "",
      reference_number: "",
      lot_number: "",
      unit_of_measure: "",
      typical_shelf_life: "",
      location: "",
      internal_notes: "",
      alert_threshold: "",
    },
  };

  componentDidMount() {
    this.loadActivity();
    this.loadInventoryEntries();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.item !== this.props.item) {
      const item = this.props.item;
      this.setState({
        isEditing: false,
        selectedTab: "Overview",
        isAddQuantityOpen: false,
        form: item
          ? {
              manufacturer: item.manufacturer ?? "",
              reference_number: item.reference_number ?? "",
              lot_number: item.lot_number ?? "",
              unit_of_measure: item.unit_of_measure || "",
              typical_shelf_life: item.typical_shelf_life ?? "",
              location: item.location ?? "",
              internal_notes: item.internal_notes ?? "",
              alert_threshold: item.alert_threshold != null ? String(item.alert_threshold) : "",
            }
          : this.state.form,
      });
      this.loadActivity();
      this.loadInventoryEntries();
    }
  }

  async loadActivity() {
    const { item } = this.props;
    if (!item) return;
    try {
      const data = await fetchItemActivityLog(item.id);
      const activity: ActivityRow[] = data.map((entry: ActivityEntry) => {
        let formattedQuantity = "-";
        if (entry.quantity != null) {
          if (["added", "donated"].includes(entry.action_type)) {
            formattedQuantity = `+${entry.quantity}`;
          } else if (entry.action_type === "assigned") {
            formattedQuantity = `-${entry.quantity}`;
          } else {
            formattedQuantity = `${entry.quantity}`;
          }
        }
        return {
          key: `${entry.id}-${entry.created_at}`,
          activity: entry.action_type,
          quantity: formattedQuantity,
          reason: entry.description || "",
          user: entry.performed_by || "",
          timestamp: entry.created_at,
        };
      });
      this.setState({ activity });
    } catch {
      this.setState({ activity: [] });
    }
  }

  async loadInventoryEntries() {
    const { item } = this.props;
    if (!item) return;
    try {
      const data = await fetchInventoryEntries(item.id);
      this.setState({ inventoryEntries: data ?? [] });
    } catch {
      this.setState({ inventoryEntries: [] });
    }
  }

  async handleAddQuantityConfirm(quantity: number, notes: string) {
    const { item } = this.props;
    if (!item) return;
    await addItemQuantity(item.id, quantity, notes, "user@email.com");
    await this.loadInventoryEntries();
    await this.loadActivity();
    if (this.props.setItems) {
      const { fetchInventory } = await import("./utils/actions");
      const data = await fetchInventory();
      this.props.setItems(
        data.map((i: any) => ({
          ...i,
          expiration: i.expiration ? new Date(i.expiration) : new Date(),
        }))
      );
    }
    this.setState({ isAddQuantityOpen: false });
  }

  renderExpirationLozenge(date?: Date | null) {
    if (!date) return null;
    const expText = `EXP ${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    return <CustomLozenge appearance="exp">{expText}</CustomLozenge>;
  }

  renderOverview() {
    const { item } = this.props;
    if (!item) return null;
    const { inventoryEntries } = this.state;

    const daysToExpiration = item.expiration
      ? (item.expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      : null;
    const expirationSoon = daysToExpiration !== null && daysToExpiration > 0 && daysToExpiration < 90;

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {expirationSoon && (
          <div style={{ marginBottom: 16 }}>
            <SectionMessage appearance="warning">
              Some inventory expires within 3 months
            </SectionMessage>
          </div>
        )}

        <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        <CustomButton
          onClick={() => this.setState({ isAddQuantityOpen: true })}
          width="190px"
          height="48px"
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 36 }}>
            <AddIcon label="Add Items" />
            Add Items
          </span>
        </CustomButton>

        <CustomButton
            backgroundColor="#A12654"
            hoverColor="#B63A69"
            textColor="#FFFFFF"
            onClick={this.props.onAssignToMission}
            width="190px"
            height="48px"
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 12 }}>
              <GlobeIcon label="Assign to Mission" />
              Assign to Mission
            </span>
          </CustomButton>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              marginBottom: 12,
              color: "#505258",
              fontFamily: "Atlassian Sans, sans-serif",
              fontSize: 16,
              fontWeight: 653,
              lineHeight: "24px",
              fontFeatureSettings: "'liga' off, 'calt' off",
            }}
          >
            Total Available
          </div>
          <CustomLozenge appearance="unit_stat">
            {`${item.quantity} ${(item.unit_of_measure ?? "UNITS").toUpperCase()}`}
          </CustomLozenge>
        </div>

        <div
          style={{
            marginBottom: 12,
            color: "#505258",
            fontFamily: "Atlassian Sans, sans-serif",
            fontSize: 16,
            fontWeight: 653,
            lineHeight: "24px",
            fontFeatureSettings: "'liga' off, 'calt' off",
          }}
        >
          Inventory Entries
        </div>

        <ScrollablePaginatedTable
          columns={[
            { key: "date", header: "Date Added", width: 120 },
            { key: "quantity", header: "Quantity Added", width: 120 },
            { key: "added_by", header: "Added By", width: 120 },
            { key: "notes", header: "Notes", width: 180 },
          ]}
          rows={
            inventoryEntries.length > 0
              ? inventoryEntries.map((entry) => ({
                  key: String(entry.id),
                  cells: [
                    entry.date_added
                      ? new Date(entry.date_added + "T00:00:00").toLocaleDateString()
                      : "-",
                    entry.quantity_added >= 0
                      ? `+${entry.quantity_added}`
                      : String(entry.quantity_added),
                    entry.added_by || "-",
                    entry.notes || "-",
                  ],
                }))
              : [{ key: "empty", cells: ["No entries yet", "", "", ""] }]
          }
          rowsPerPage={5}
        />
      </div>
    );
  }

  renderDetails() {
    const { item } = this.props;
    if (!item) return null;
    const { form, isEditing } = this.state;

    const updateField = (key: keyof State["form"], value: string) => {
      this.setState({ form: { ...form, [key]: value } });
    };

    const renderField = (label: string, key: keyof State["form"], placeholder?: string) => {
      if (isEditing) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>{label}</div>
            <input
              value={form[key] ?? ""}
              placeholder={placeholder}
              onChange={(e) => updateField(key, e.target.value)}
              style={{ padding: 8, border: "1px solid #DFE1E6", borderRadius: 6, fontSize: 14 }}
            />
          </div>
        );
      }
      return (
        <CustomInlineEdit
          label={label}
          value={(form[key] as string) || (placeholder ?? "")}
          onSave={async (v) => {
            updateField(key, v);
            await updateItemDetails(item.id, { [key]: v } as UpdateItemDetailsPayload, "user@email.com");
          }}
        />
      );
    };

    const parseThreshold = (v: string): number | null => {
      const trimmed = v.trim();
      if (trimmed === "") return null;
      const n = Number(trimmed);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    };

    const renderThresholdField = () => {
      const fieldLabel = "Low Stock Alert Threshold";
      if (isEditing) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>{fieldLabel}</div>
            <input
              type="number"
              min={0}
              value={form.alert_threshold ?? ""}
              placeholder="Alert when quantity falls below this"
              onChange={(e) => updateField("alert_threshold", e.target.value)}
              style={{ padding: 8, border: "1px solid #DFE1E6", borderRadius: 6, fontSize: 14 }}
            />
          </div>
        );
      }
      return (
        <CustomInlineEdit
          label={fieldLabel}
          value={form.alert_threshold || ""}
          onSave={async (v) => {
            updateField("alert_threshold", v);
            await updateItemDetails(item.id, { alert_threshold: parseThreshold(v) }, "user@email.com");
          }}
        />
      );
    };

    return (
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {renderField("Manufacturing Company", "manufacturer", item.manufacturer ?? "")}
          <div />
          {renderField("Reference Number", "reference_number", item.reference_number ?? "")}
          {renderField("Lot Number", "lot_number", item.lot_number ?? "")}
          {renderField("Unit of Measure", "unit_of_measure", item.unit_of_measure || "")}
          {renderField("Typical Shelf Life", "typical_shelf_life", item.typical_shelf_life ? `${item.typical_shelf_life} days` : "")}
          {renderField("Location", "location", item.location ?? "")}
          {renderThresholdField()}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>Created By</div>
            <div style={{ fontSize: 14, color: "#172B4D" }}>{item.created_by ?? "-"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>Created Date</div>
            <div style={{ fontSize: 14, color: "#172B4D" }}>{new Date(item.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>Last Updated</div>
            <div style={{ fontSize: 14, color: "#172B4D" }}>{new Date(item.updated_at).toLocaleString()}</div>
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: 12 }}>Internal Notes</h4>
          {isEditing ? (
            <textarea
              value={form.internal_notes}
              placeholder={item.internal_notes ?? "Add notes..."}
              onChange={(e) => this.setState({ form: { ...form, internal_notes: e.target.value } })}
              style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: 8, border: "1px solid #DFE1E6", fontSize: 14 }}
            />
          ) : (
            <CustomInlineEdit
              label="Internal Notes"
              value={form.internal_notes || item.internal_notes || ""}
              onSave={async (v) => {
                updateField("internal_notes", v);
                await updateItemDetails(item.id, { internal_notes: v }, "user@email.com");
              }}
            />
          )}
        </div>
      </div>
    );
  }

  renderDocumentation() {
    const { item } = this.props;
    if (!item) return null;

    const Field = ({ label, value }: { label: string; value: string }) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6B778C", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 14, color: "#172B4D" }}>{value || "-"}</span>
      </div>
    );

    return (
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <Field label="Total Value" value={item.total_value ? `$${item.total_value.toLocaleString()}` : "-"} />
          <Field label="Market Value Per Unit" value={item.market_value_per_unit ? `$${item.market_value_per_unit}` : "-"} />
          <Field label="Date Value Researched" value={item.value_researched_date ? new Date(item.value_researched_date).toLocaleDateString() : "-"} />
          <Field label="Valuation Source" value={item.valuation_source ?? "-"} />
        </div>

        <div>
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#505258",
                fontFamily: "Atlassian Sans, sans-serif",
                fontSize: 16,
                fontWeight: 653,
                lineHeight: "24px",
                fontFeatureSettings: "'liga' off, 'calt' off",
              }}
            >
              Supporting Documents
            </span>
            {this.props.onAddDocumentation && (
              <CustomButton
                backgroundColor="#422670"
                textColor="#FFFFFF"
                onClick={this.props.onAddDocumentation}
              >
                Add documentation
              </CustomButton>
            )}
          </div>
          {(item.documents ?? []).length === 0 ? (
            <p style={{ fontSize: 13, color: "#6B778C" }}>No documents uploaded yet.</p>
          ) : (
            <ScrollablePaginatedTable
              columns={[
                { key: "name", header: "Document Name", width: 150 },
                { key: "type", header: "Type", width: 100 },
                { key: "uploaded_by", header: "Uploaded By", width: 100 },
                { key: "date", header: "Date", width: 100 },
              ]}
              rows={(item.documents ?? []).map((doc: DocumentEntry) => ({
                key: doc.id,
                cells: [
                  doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0052CC", textDecoration: "underline" }}
                    >
                      {doc.name}
                    </a>
                  ) : (
                    doc.name
                  ),
                  doc.type,
                  doc.uploaded_by,
                  new Date(doc.created_at).toLocaleDateString(),
                ],
              }))}
              rowsPerPage={5}
            />
          )}
        </div>
      </div>
    );
  }

  render() {
    const { isOpen, onClose, item } = this.props;
    const { selectedTab, isAddQuantityOpen } = this.state;

    if (!item) return null;

    return (
      <>
        <SidePanel
          isOpen={isOpen}
          onClose={onClose}
          title={
            <div style={{ borderTop: "1px solid #DFE1E6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
                <CustomLozenge appearance="stat">{item.status}</CustomLozenge>
                {this.renderExpirationLozenge(item.expiration) ?? null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
                <CustomLozenge appearance="unit_stat">
                  {item.quantity} {item.unit_of_measure ?? "UNITS"}
                </CustomLozenge>
              </div>
            </div>
          }
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <CustomButton 
                backgroundColor="#EBECF0"
                hoverColor="#DFE1E6"
                textColor="#172B4D" 
                onClick={onClose}
              >
                Cancel
              </CustomButton>
              {this.state.isEditing ? (
                <CustomButton
                  onClick={async () => {
                    if (!item) return;
                    const { alert_threshold, ...rest } = this.state.form;
                    const trimmed = alert_threshold.trim();
                    const parsedThreshold =
                      trimmed === "" || !Number.isFinite(Number(trimmed))
                        ? null
                        : Math.max(0, Math.round(Number(trimmed)));
                    await updateItemDetails(
                      item.id,
                      { ...rest, alert_threshold: parsedThreshold },
                      "user@email.com"
                    );
                    this.setState({ isEditing: false });
                  }}
                >
                  Save Changes
                </CustomButton>
              ) : (
                <CustomButton
                  iconBefore={<EditIcon label="Edit Item" />}
                  onClick={() => this.setState({ isEditing: true })}
                >
                  Edit Item
                </CustomButton>
              )}
            </div>
          }
        >
          <SwappedPageHeader
            title={item.item_description}
            breadcrumbs={
              <Breadcrumbs>
                <BreadcrumbsItem text={item.reference_number ?? "-"} />
                <BreadcrumbsItem text={item.location ?? "-"} />
              </Breadcrumbs>
            }
          />

          <div style={{ display: "flex", width: "100%", borderBottom: "1px solid #DFE1E6", gap: 32, paddingTop: 12 }}>
            {["Overview", "Activity", "Documentation", "Details"].map((tab) => (
              <div
                key={tab}
                onClick={() => this.setState({ selectedTab: tab as State["selectedTab"] })}
                style={{
                  padding: "8px 0",
                  cursor: "pointer",
                  fontWeight: 600,
                  borderBottom: selectedTab === tab ? "2px solid #422670" : "none",
                  color: selectedTab === tab ? "#422670" : "#172B4D",
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            {selectedTab === "Overview" && this.renderOverview()}
            {selectedTab === "Activity" && (
              <ScrollablePaginatedTable
                columns={[
                  { key: "activity", header: "Activity", width: 50 },
                  { key: "quantity", header: "Quantity", width: 50 },
                  { key: "reason", header: "Reason", width: 200 },
                  { key: "user", header: "User", width: 100 },
                  { key: "timestamp", header: "Date", width: 100 },
                ]}
                rows={this.state.activity.map((a) => ({
                  key: a.key,
                  cells: [a.activity, a.quantity, a.reason, a.user, new Date(a.timestamp).toLocaleDateString()],
                }))}
                rowsPerPage={8}
              />
            )}
            {selectedTab === "Documentation" && this.renderDocumentation()}
            {selectedTab === "Details" && this.renderDetails()}
          </div>
        </SidePanel>

        {isAddQuantityOpen && (
          <AddQuantityModal
            itemDescription={item.item_description}
            onConfirm={(qty, notes) => this.handleAddQuantityConfirm(qty, notes)}
            onClose={() => this.setState({ isAddQuantityOpen: false })}
          />
        )}
      </>
    );
  }
}