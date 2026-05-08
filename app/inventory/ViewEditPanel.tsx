"use client";

import React from "react";
import CustomLozenge from "./components/custom-lozenge";
import SectionMessage from "@atlaskit/section-message";
import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import CustomButton from "./components/custom-button";
import { SwappedPageHeader } from "./components/swapped-page-header";
import CustomInlineEdit from "./components/CustomInlineEdit";
import Textfield from '@atlaskit/textfield';

import ScrollablePaginatedTable from "./components/scrollable-table";

import { InventoryItem } from "./utils/types";
import { SidePanel } from "./components/SidePanel";
import { fetchItemActivityLog, updateItemDetails } from "./utils/actions";

import AddIcon from "@atlaskit/icon/core/add";
import GlobeIcon from "@atlaskit/icon/core/globe";
import EditIcon from "@atlaskit/icon/core/edit";
import CashIcon from '@atlaskit/icon/core/cash';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  mode: "view" | "edit";
  setItems?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

interface State {
  isEditing: boolean;
  selectedTab: "Overview" | "Activity" | "Documentation" | "Details";
  activity: any[];

  form: {
    manufacturer: string;
    reference_number: string;
    lot_number: string;
    unit_of_measure: string;
    typical_shelf_life: string;
    location: string;
    internal_notes: string;
  };
}
export default class ViewEditPanel extends React.Component<Props, State> {
  state: State = {
    isEditing: false,
    selectedTab: "Overview",
    activity: [],
    form: {
      manufacturer: "",
      reference_number: "",
      lot_number: "",
      unit_of_measure: "",
      typical_shelf_life: "",
      location: "",
      internal_notes: "",
    },
  };

  componentDidMount() {
    this.loadActivity();
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.mode !== this.props.mode ||
      prevProps.item !== this.props.item
    ) {
      const item = this.props.item;

      this.setState({
        isEditing: this.props.mode === "edit",
        form: item
          ? {
              manufacturer: item.manufacturer || "",
              reference_number: item.reference_number || "",
              lot_number: item.lot_number || "",
              unit_of_measure: item.unit_of_measure?.label || item.unit_of_measure || "",
              typical_shelf_life: item.typical_shelf_life || "",
              location: item.location || "",
              internal_notes: item.internal_notes || "",
            }
          : this.state.form,
      });

      this.loadActivity();
    }  }

  // ---------------------------
  // ACTIVITY TAB LOGIC
  // ---------------------------
  async loadActivity() {
    const { item } = this.props;
    if (!item) return;

    try {
      const data = await fetchItemActivityLog(item.id);
      const activity = data.map((entry: any) => {
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

  // ---------------------------
  // EXPIRATION LOZENGE
  // ---------------------------
  renderExpirationLozenge(date?: Date) {
    if (!date) return null;

    const expText = `EXP ${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

    return (
      <CustomLozenge appearance="exp" isBold>
        {expText}
      </CustomLozenge>
    );
  }

  // ---------------------------
  // OVERVIEW TAB
  // ---------------------------
  renderOverview() {
    const { item } = this.props;
    if (!item) return null;

    const daysToExpiration = item.expiration
      ? (item.expiration.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
      : null;

    const expirationSoon =
      daysToExpiration !== null &&
      daysToExpiration > 0 &&
      daysToExpiration < 90;

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
          <CustomButton iconBefore={<AddIcon label="" />}>
            Add Items
          </CustomButton>
          <CustomButton
            backgroundColor="#A12654"
            hoverColor="#B63A69"
            textColor="#FFFFFF"
            iconBefore={<GlobeIcon label="" />}
          >
            Assign to Mission
          </CustomButton>
        </div>

        <div style={{ marginBottom: 24 }}>
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

          <CustomLozenge appearance="unit_stat" isBold>
            {`${item.quantity} ${(
              item.unit_of_measure || "UNITS"
            ).toUpperCase()}`}
          </CustomLozenge>
        </div>

        <ScrollablePaginatedTable
          columns={[
            { key: "field", header: "Field", width: 100 },
            { key: "value", header: "Value", width: 100 },
          ]}
          rows={[
            { key: "manufacturer", cells: ["Manufacturer", item.manufacturer] },
            { key: "reference", cells: ["Reference Number", item.reference_number] },
            { key: "lot", cells: ["Lot Number", item.lot_number] },
            {
              key: "unit",
              cells: ["Unit of Measure", item.unit_of_measure?.label],
            },
          ]}
          rowsPerPage={5}
        />
      </div>
    );
  }

// ---------------------------
// DETAILS TAB
// ---------------------------
renderDetails() {
  const { item } = this.props;
  if (!item) return null;

  const { form, isEditing } = this.state;

  const updateField = (key: keyof State["form"], value: string) => {
    this.setState({
      form: {
        ...form,
        [key]: value,
      },
    });
  };

  const renderField = (
    label: string,
    key: keyof State["form"],
    placeholder?: string
  ) => {
    // =========================
    // BULK EDIT MODE (ALL FIELDS)
    // =========================
    if (isEditing) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>
            {label}
          </div>

          <input
            value={form[key] ?? ""}
            placeholder={placeholder}
            onChange={(e) => updateField(key, e.target.value)}
            style={{
              padding: 8,
              border: "1px solid #DFE1E6",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>
      );
    }

    // =========================
    // INLINE MODE (DEFAULT)
    // =========================
    return (
      <CustomInlineEdit
        label={label}
        value={(form[key] as string) || (placeholder ?? "")}
        onSave={async (v) => {
          updateField(key, v);

          await updateItemDetails(
            item.id,
            {
              [key]: v,
            } as any,
            "user@email.com"
          );
        }}
      />
    );
  };

  return (
    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 32 }}>
      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {renderField("Manufacturing Company", "manufacturer", item.manufacturer)}

        <div />

        {renderField("Reference Number", "reference_number", item.reference_number)}

        {renderField("Lot Number", "lot_number", item.lot_number)}

        {renderField(
          "Unit of Measure",
          "unit_of_measure",
          item.unit_of_measure?.label || item.unit_of_measure
        )}

        {renderField(
          "Typical Shelf Life",
          "typical_shelf_life",
          item.typical_shelf_life ? `${item.typical_shelf_life} days` : ""
        )}

        {renderField("Location", "location", item.location)}
      </div>

      {/* META */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>
            Created By
          </div>
          <div style={{ fontSize: 14, color: "#172B4D" }}>
            {item.created_by || "-"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>
            Created Date
          </div>
          <div style={{ fontSize: 14, color: "#172B4D" }}>
            {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>
            Last Updated
          </div>
          <div style={{ fontSize: 14, color: "#172B4D" }}>
            {new Date(item.updated_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* INTERNAL NOTES */}
      <div>
        <h4 style={{ marginBottom: 12 }}>Internal Notes</h4>

        {isEditing ? (
          <textarea
            value={form.internal_notes}
            placeholder={item.internal_notes || "Add notes..."}
            onChange={(e) =>
              this.setState({
                form: {
                  ...form,
                  internal_notes: e.target.value,
                },
              })
            }
            style={{
              width: "100%",
              minHeight: 100,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #DFE1E6",
              fontSize: 14,
            }}
          />
        ) : (
          <CustomInlineEdit
            label="Internal Notes"
            value={form.internal_notes || item.internal_notes || ""}
            onSave={async (v) => {
              updateField("internal_notes", v);

              await updateItemDetails(
                item.id,
                { internal_notes: v },
                "user@email.com"
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
  // ---------------------------
  // DOCUMENTATION TAB
  // ---------------------------
  renderDocumentation() {
    const { item } = this.props;
    if (!item) return null;

    const Field = ({ label, value }: { label: string; value: any }) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6B778C", fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ fontSize: 14, color: "#172B4D" }}>
          {value || "-"}
        </span>
      </div>
    );

    return (
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Valuation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <Field iconBefore={<CashIcon label="" />} label="Total Value" value={item.total_value ? `$${item.total_value.toLocaleString()}` : "-"} />
          <Field label="Market Value Per Unit" value={item.market_value_per_unit ? `$${item.market_value_per_unit}` : "-"} />
          <Field label="Date Value Researched" value={item.value_researched_date ? new Date(item.value_researched_date).toLocaleDateString() : "-"} />
          <Field label="Valuation Source" value={item.valuation_source} />
        </div>

        {/* Documents */}
        <div>
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
            Supporting Documents
          </div>
          <ScrollablePaginatedTable
            columns={[
              { key: "name", header: "Document Name", width: 150 },
              { key: "type", header: "Type", width: 100 },
              { key: "uploaded_by", header: "Uploaded By", width: 100 },
              { key: "date", header: "Date", width: 100 },
            ]}
            rows={(item.documents || []).map((doc: any) => ({
              key: doc.id,
              cells: [
                doc.name,
                doc.type,
                doc.uploaded_by,
                new Date(doc.created_at).toLocaleDateString(),
              ],
            }))}
            rowsPerPage={5}
          />
        </div>
      </div>
    );
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  render() {
    const { isOpen, onClose, item } = this.props;
    const { selectedTab } = this.state;

    if (!item) return null;

    return (
      <SidePanel
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div style={{ borderTop: "1px solid #DFE1E6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
              <CustomLozenge appearance="stat" isBold>
                IN STORAGE
              </CustomLozenge>
              {this.renderExpirationLozenge(item.expiration)}
            </div>

            <CustomLozenge appearance="unit_stat" isBold>
              {item.quantity} {item.unit_of_measure?.label || "UNITS"}
            </CustomLozenge>
          </div>
        }
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
            <CustomButton backgroundColor="#EBECF0" textColor="#172B4D" onClick={onClose}>
              Cancel
            </CustomButton>

            {this.state.isEditing ? (
              <CustomButton
                backgroundColor="#422670"
                textColor="#FFFFFF"
                onClick={async () => {
                  const { item } = this.props;
                  if (!item) return;

                  await updateItemDetails(item.id, this.state.form, "user@email.com");

                  this.setState({ isEditing: false });
                }}
              >
                Save Changes
              </CustomButton>
            ) : (
              <CustomButton
                backgroundColor="#422670"
                textColor="#FFFFFF"
                iconBefore={<EditIcon label="" />}
                onClick={() => this.setState({ isEditing: true })}
              >
                Edit Item
              </CustomButton>
            )}
          </div>
        }      >
        <SwappedPageHeader
          title={item.item_description}
          breadcrumbs={
            <Breadcrumbs>
              <BreadcrumbsItem text={item.reference_number} />
              <BreadcrumbsItem text={item.location} />
            </Breadcrumbs>
          }
        />

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #DFE1E6", gap: 16, paddingTop: 12 }}>
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

        {/* Content */}
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
    );
  }
}