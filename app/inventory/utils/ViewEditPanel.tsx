"use client";

import React from "react";
import Drawer from "@atlaskit/drawer";
import Button from "@atlaskit/button/new";
import Tabs, { Tab, TabList, TabPanel } from "@atlaskit/tabs";
import Lozenge from "@atlaskit/lozenge";
import SectionMessage from "@atlaskit/section-message";
import DynamicTable from "@atlaskit/dynamic-table";
import Tag from "@atlaskit/tag";
import PageHeader from "@atlaskit/page-header";
import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";

import { InventoryItem } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  mode: "view" | "edit";
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

interface State {
  isEditing: boolean;
}

export default class ViewEditPanel extends React.Component<Props, State> {
  state: State = {
    isEditing: false,
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.mode !== this.props.mode || prevProps.item !== this.props.item) {
      this.setState({ isEditing: this.props.mode === "edit" });
    }
  }

  renderExpirationLozenge(date?: Date) {
    if (!date) return null;
    const today = new Date();
    const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    let appearance: any = "success";
    if (diff < 0) appearance = "removed";
    else if (diff < 90) appearance = "inprogress";

    return (
      <Lozenge appearance={appearance} isBold>
        {date.toISOString().split("T")[0]}
      </Lozenge>
    );
  }

  renderOverview() {
    const { item } = this.props;
    if (!item) return null;

    const expirationSoon =
      item.expiration && (item.expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 90;

    const head = {
      cells: [
        { key: "field", content: "Field" },
        { key: "value", content: "Value" },
      ],
    };

    const rows = [
      { key: "manufacturer", cells: [{ key: "f", content: "Manufacturer" }, { key: "v", content: item.manufacturer }] },
      { key: "reference", cells: [{ key: "f", content: "Reference Number" }, { key: "v", content: item.reference_number }] },
      { key: "lot", cells: [{ key: "f", content: "Lot Number" }, { key: "v", content: item.lot_number }] },
      { key: "unit", cells: [{ key: "f", content: "Unit of Measure" }, { key: "v", content: item.unit_of_measure?.label }] },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {expirationSoon && (
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <SectionMessage appearance="warning">Some inventory expires within 3 months</SectionMessage>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 8 }}>Total Available</h4>
          <Tag text="2000 UNITS" />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {/* <Button iconBefore={<AddIcon label="Add" />} appearance="discovery">Add Items</Button> */}
          <Button appearance="danger">Assign to Mission</Button>
          <Button appearance="subtle">Adjust Inventory</Button>
        </div>

        <div>
          <h4 style={{ marginBottom: 12 }}>Inventory Entries Table</h4>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 150 }}>
              <DynamicTable head={head} rows={rows} rowsPerPage={5} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { isOpen, onClose, item } = this.props;
    if (!item) return null;

    const headerBreadcrumbs = (
      <Breadcrumbs>
        <BreadcrumbsItem text={item.reference_number} />
        <BreadcrumbsItem text={item.location} />
      </Breadcrumbs>
    );

    return (
      <Drawer isOpen={isOpen} onClose={onClose} width="wide" label="Inventory Item">
        <div style={{ padding: 24 }}>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Lozenge appearance="inprogress" isBold>IN STORAGE</Lozenge>{" "}
            {this.renderExpirationLozenge(item.expiration)}
          </div>

          <div style={{ marginBottom: 16, display: "flex" }}>
            <PageHeader breadcrumbs={headerBreadcrumbs}>{item.item_description}</PageHeader>
          </div>

          <Tabs id="view-edit-tabs">
            <TabList>
              <Tab>Overview</Tab>
              <Tab>Activity</Tab>
              <Tab>Documentation</Tab>
              <Tab>Details</Tab>
            </TabList>

            <TabPanel>{this.renderOverview()}</TabPanel>
            <TabPanel><div style={{ marginTop: 24 }}>Activity history will go here.</div></TabPanel>
            <TabPanel><div style={{ marginTop: 24 }}>Documentation files will go here.</div></TabPanel>
            <TabPanel><div style={{ marginTop: 24 }}>Additional metadata fields go here.</div></TabPanel>
          </Tabs>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <Button appearance="subtle" onClick={onClose}>Cancel</Button>{" "}
              <Button appearance="primary" onClick={() => this.setState({ isEditing: !this.state.isEditing })}>
                {this.state.isEditing ? "Save Changes" : "Edit Item"}
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    );
  }
}