"use client";

import React from "react";
import Lozenge from "@atlaskit/lozenge";
import SectionMessage from "@atlaskit/section-message";
import Tag from "@atlaskit/tag";
import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import Button from "@atlaskit/button/new";
import { SwappedPageHeader } from "./swapped-page-header";

import ScrollablePaginatedTable from "./scrollable-table";

import { InventoryItem } from "../types";
import { SidePanel } from "./SidePanel";

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
    }
  }

  // ---------------------------
  // ACTIVITY PARSER
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
          activity: activityMap[action],
          status: itemName,
          reason: `${user} • Item ${itemId}`,
          timestamp,
        };
      })
      .filter(Boolean);
  }

  async loadActivity() {
    try {
      const res = await fetch("/inventory-changes.txt");
      const text = await res.text();
      this.setState({ activity: this.parseActivityLog(text) });
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

    const expirationSoon =
      item.expiration &&
      (item.expiration.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24) < 90;

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {expirationSoon && (
          <div style={{ marginBottom: 16 }}>
            <SectionMessage appearance="warning">
              Some inventory expires within 3 months
            </SectionMessage>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 8 }}>Total Available</h4>
          <Tag text="2000 UNITS" />
        </div>

        <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
          <Button appearance="danger">Assign to Mission</Button>
          <Button appearance="subtle">Adjust Inventory</Button>
        </div>

        {/* Inventory Entries Table (NOW CUSTOM TABLE) */}
        <div>
          <h4 style={{ marginBottom: 12 }}>
            Inventory Entries
          </h4>

          <ScrollablePaginatedTable
            columns={[
              { key: "field", header: "Field", width: 200 },
              { key: "value", header: "Value", width: 300 },
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
            <Button appearance="subtle" onClick={onClose}>
              Close
            </Button>
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

          {/* ACTIVITY TABLE (CUSTOM) */}
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
                    width: 220,
                  },
                  {
                    key: "status",
                    header: "Item",
                    width: 250,
                  },
                  {
                    key: "reason",
                    header: "Details",
                    width: 300,
                  },
                  {
                    key: "timestamp",
                    header: "Timestamp",
                    width: 250,
                  },
                ]}
                rows={this.state.activity.map((a) => ({
                  key: a.key,
                  cells: [
                    a.activity,
                    a.status,
                    a.reason,
                    new Date(a.timestamp).toLocaleString(),
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