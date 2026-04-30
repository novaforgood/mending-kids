"use client";

import React from "react";
import Lozenge from "@atlaskit/lozenge";
import SectionMessage from "@atlaskit/section-message";
import Tag from "@atlaskit/tag";
import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import CustomButton from "./components/custom-button";
import { SwappedPageHeader } from "./components/swapped-page-header";

import ScrollablePaginatedTable from "./components/scrollable-table";

import { InventoryItem } from "./utils/types";
import { SidePanel } from "./components/SidePanel";
import { fetchItemActivityLog } from "./actions";

import AddIcon from "@atlaskit/icon/core/add";
import GlobeIcon from '@atlaskit/icon/core/globe';
import EditIcon from '@atlaskit/icon/core/edit';

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
}

export default class ViewEditPanel extends React.Component<Props, State> {
  state: State = {
    isEditing: false,
    selectedTab: "Overview",
    activity: [],
  };

  componentDidMount() {
    this.loadActivity();
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.mode !== this.props.mode ||
      prevProps.item !== this.props.item
    ) {
      this.setState({ isEditing: this.props.mode === "edit" });
      this.loadActivity();
    }
  }

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
          quantity: formattedQuantity, // 👈 use formatted value here
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
  renderExpirationLozenge(date?: Date) {
    if (!date) return null;

    const today = new Date();
    const diff =
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    let appearance: any = "success";
    if (diff < 0) appearance = "removed";
    else if (diff < 90) appearance = "inprogress";

    return (
      <Lozenge appearance={appearance} isBold>
        {date.toISOString().split("T")[0]}
      </Lozenge>
    );
  }

  // ---------------------------
  // OVERVIEW TAB
  // ---------------------------
  renderOverview() {
    const { item } = this.props;
    if (!item) return null;

    const daysToExpiration = item.expiration
      ? (item.expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
          <CustomButton backgroundColor="#A12654" hoverColor="#B63A69"textColor="#FFFFFF" iconBefore={<GlobeIcon label="" />}>
            Assign to Mission
          </CustomButton>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 8 }}>Total Available</h4>
          <Tag
            text={`${item.quantity} ${(
              item.unit_of_measure || "UNITS"
            ).toUpperCase()}`}
          />
        </div>

        <ScrollablePaginatedTable
          columns={[
            { key: "field", header: "Field", width: 100 },
            { key: "value", header: "Value", width: 100 },
          ]}
          rows={[
            {
              key: "manufacturer",
              cells: ["Manufacturer", item.manufacturer],
            },
            {
              key: "reference",
              cells: ["Reference Number", item.reference_number],
            },
            {
              key: "lot",
              cells: ["Lot Number", item.lot_number],
            },
            {
              key: "unit",
              cells: [
                "Unit of Measure",
                item.unit_of_measure?.label,
              ],
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

    const formatDate = (date?: Date | string) => {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

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
        
        {/* Section: Manufacturing */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <Field label="Manufacturing Company" value={item.manufacturer} />
          <div/>
          <Field label="Reference Number" value={item.reference_number} />
          <Field label="Lot Number" value={item.lot_number} />
          <Field
            label="Unit of Measure"
            value={item.unit_of_measure?.label}
          />
          <Field
            label="Typical Shelf Life"
            value={
              item.typical_shelf_life
                ? `${item.typical_shelf_life} days`
                : "-"
            }
          />
          {/* Section: Inventory Info */}
          <Field label="Location" value={item.location} />
        </div>

        {/* Section: Audit Info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <Field label="Created By" value={item.created_by} />
          <Field label="Created Date" value={new Date(item.created_at).toLocaleDateString()} />
          <Field label="Last Updated" value={new Date(item.updated_at).toLocaleString() || "-"} />
        </div>

        {/* Section: Notes */}
        <div>
          <h4 style={{ marginBottom: 12 }}>Internal Notes</h4>
          <div
            style={{
              background: "#F4F5F7",
              padding: 16,
              borderRadius: 8,
              minHeight: 80,
              color: "#172B4D",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {item.internal_notes || "No notes for this item :)"}
          </div>
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
          <div style={{ borderTop: "1px solid #DFE1E6" }}>
            <Lozenge>IN STORAGE</Lozenge>{" "}
            {this.renderExpirationLozenge(item.expiration)}
          </div>
        }
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
            <CustomButton
              backgroundColor="#EBECF0"
              textColor="#172B4D"
              onClick={onClose}
            >
              Cancel
            </CustomButton>
            <CustomButton
              backgroundColor="#422670"
              textColor="#FFFFFF"
              iconBefore={<EditIcon label="" />}
            >
              Edit Item
            </CustomButton>
          </div>
        }
      >
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
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #DFE1E6",
            gap: 16,
            paddingTop: 12,
          }}
        >
          {["Overview", "Activity", "Documentation", "Details"].map(
            (tab) => (
              <div
                key={tab}
                onClick={() =>
                  this.setState({
                    selectedTab:
                      tab as State["selectedTab"],
                  })
                }
                style={{
                  padding: "8px 0",
                  cursor: "pointer",
                  fontWeight: 600,
                  borderBottom:
                    selectedTab === tab
                      ? "2px solid #0052CC"
                      : "none",
                  color:
                    selectedTab === tab
                      ? "#0052CC"
                      : "#172B4D",
                }}
              >
                {tab}
              </div>
            )
          )}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 16 }}>
          {selectedTab === "Overview" && this.renderOverview()}

          {selectedTab === "Activity" && (
            <ScrollablePaginatedTable
              columns={[
                { key: "activity", header: "Activity", width: 50 },
                { key: "quantity", header: "Status", width: 50 },
                { key: "reason", header: "Reason", width: 200 },
                { key: "user", header: "User", width: 100 },
                { key: "timestamp", header: "Date", width: 100 },
              ]}
              rows={this.state.activity.map((a) => ({
                key: a.key,
                cells: [
                  a.activity,
                  a.quantity,
                  a.reason,
                  a.user,
                  new Date(a.timestamp).toLocaleDateString(),
                ],
              }))}
              rowsPerPage={8}
            />
          )}

          {selectedTab === "Documentation" && (
            <div style={{ marginTop: 24 }}>
              Documentation files will go here.
            </div>
          )}

          {selectedTab === "Details" && this.renderDetails()}
        </div>
      </SidePanel>
    );
  }
}