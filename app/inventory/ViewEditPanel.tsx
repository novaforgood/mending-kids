"use client";

import React from "react";
import Lozenge from "@atlaskit/lozenge";
import SectionMessage from "@atlaskit/section-message";
import Tag from "@atlaskit/tag";
import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import Button from "@atlaskit/button/new";
import CustomButton from "./components/custom-button";
import { SwappedPageHeader } from "./components/swapped-page-header";

import ScrollablePaginatedTable from "./components/scrollable-table";

import { InventoryItem } from "./utils/types";
import { SidePanel } from "./components/SidePanel";
import { fetchItemActivityLog } from "./actions";

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
  parseActivityLog(log: string) {
    const activityMap: Record<string, string> = {
      ADD: "Added inventory",
      DEL: "Removed inventory",
      EXP: "Expired automatically",
      UPD: "Updated item details",
    };

    return log
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = line.match(
          /^\[(.*?)\]\s+(ADD|DEL|EXP|UPD)\s+by\s+(.*?)\s+\|\s+Item ID:\s+(\d+)\s+\|\s+(.*)$/
        );

        if (!match) return null;

        const [, timestamp, action, user, itemId, itemName] = match;

        return {
          key: `${itemId}-${timestamp}`,
          reason: `${user} • Item ${itemId}`,
          activity: activityMap[action],
          user: user,
          timestamp,
        };
      })
      .filter(Boolean);
  }

  async loadActivity() {
    const { item } = this.props;
    if (!item) return;

    try {
      const data = await fetchItemActivityLog(item.id);
      const activity = data.map((entry: any) => ({
        key: `${entry.id}-${entry.created_at}`,
        activity: entry.action_type,
        status: "",
        reason: entry.description || "",
        user: entry.performed_by || "",
        timestamp: entry.created_at,
      }));
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
          <CustomButton backgroundColor="#251343" textColor="#FFFFFF" hoverColor="#251343">Add Items</CustomButton>
          <CustomButton backgroundColor="#A12654" textColor="#FFFFFF" hoverColor="#A12654">Assign to Mission</CustomButton>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 8 }}>Total Available</h4>
          <Tag text={`${item.quantity} ${(item.unit_of_measure || "UNITS").toUpperCase()}`} />
        </div>

        {/* Inventory Entries Table (NOW CUSTOM TABLE) */}
        <div>
          <h4 style={{ marginBottom: 12 }}>
            Inventory Entries
          </h4>

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
      </div>
    );
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  render() {
    const { isOpen, onClose, item, mode } = this.props;
    const { selectedTab } = this.state;

    if (!item) return null;

    return (
      <SidePanel
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div style={{ borderTop: "1px solid #DFE1E6" }}>
            <div>
              <Lozenge>IN STORAGE</Lozenge>{" "}
              {this.renderExpirationLozenge(item.expiration)}
            </div>
          </div>
        }
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <CustomButton backgroundColor="#EBECF0" textColor="#172B4D" hoverColor="#DFE1E6" onClick={onClose}>
              Close
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
          {selectedTab === "Overview" &&
            this.renderOverview()}

          {/* ACTIVITY TABLE */}
          {selectedTab === "Activity" && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 12 }}>
                Activity History
              </h4>

              <ScrollablePaginatedTable
                columns={[
                  {
                    key: "activity",
                    header: "Activity",
                    width: 100,
                  },
                  {
                    key: "status",
                    header: "Status",
                    width: 50,
                  },
                  {
                    key: "reason",
                    header: "Reason",
                    width: 100,
                  },
                  {
                    key: "user",
                    header: "User",
                    width: 100,
                  },
                  {
                    key: "timestamp",
                    header: "Date",
                    width: 100,
                  },
                ]}
                rows={this.state.activity.map((a) => ({
                  key: a.key,
                  cells: [
                    a.activity,
                    a.status,
                    a.reason,
                    a.user,
                    new Date(a.timestamp).toLocaleDateString(),
                  ],
                }))}
                rowsPerPage={8}
              />
            </div>
          )}

          {selectedTab === "Documentation" && (
            <div style={{ marginTop: 24 }}>
              Documentation files will go here.
            </div>
          )}

          {selectedTab === "Details" && (
            <div style={{ marginTop: 24 }}>
              Additional metadata fields go here.
            </div>
          )}
        </div>
      </SidePanel>
    );
  }
}