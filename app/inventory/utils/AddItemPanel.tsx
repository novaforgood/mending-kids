"use client";

import React from "react";
import Drawer from "@atlaskit/drawer";
import Button from "@atlaskit/button/new";
import Form, {
  Field,
  FormHeader,
  ErrorMessage,
  MessageWrapper,
  ValidMessage,
} from "@atlaskit/form";
import Select from "@atlaskit/select";
import Textfield from "@atlaskit/textfield";
import { InventoryItem } from "../types";
import PageHeader from '@atlaskit/page-header';
import Page from "@atlaskit/page";

interface AddItemPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface AddItemFormValues {
  itemDescription: string;
  manufacturer: string;
  referenceNumber: string;
  expiration: string;
  lotNumber: string;
  unitOfMeasure: UnitOption;

  // Step 2 fields
  marketValue: string;
  validationSource: string;
  acquisitionMethod: "Purchased" | "Donated";
  document?: File;
}

interface State {
  step: number;
  formData: Partial<AddItemFormValues>;
}

interface AcquisitionOption {
  label: string;
  value: "Purchased" | "Donated";
}

interface UnitOption {
  label: string;
  value: "Each" | "Box" | "Case" | "Pack" | "Bottle";
}

export default class AddItemPanel extends React.Component<
  AddItemPanelProps,
  State
> {
  state: State = {
    step: 1,
    formData: {},
  };

  nextStep = (values?: Partial<AddItemFormValues>) => {
    this.setState((prev) => ({
      step: prev.step + 1,
      formData: { ...prev.formData, ...values },
    }));
  };

  prevStep = () => {
    this.setState((prev) => ({
      step: prev.step - 1,
    }));
  };

  handleFinalSubmit = () => {
    const { setItems, items, setError, onClose } = this.props;
    const data = this.state.formData;

    try {
      const newItem: InventoryItem = {
        id: Date.now(),
        item_description: data.itemDescription!,
        manufacturer: data.manufacturer!,
        reference_number: data.referenceNumber!,
        expiration: data.expiration
          ? new Date(data.expiration)
          : undefined,
        lot_number: data.lotNumber!,
        unit_of_measure: data.unitOfMeasure,
      };

      setItems([newItem, ...items]);
      setError(null);
      onClose();
      this.setState({ step: 1, formData: {} });
    } catch {
      setError("Failed to add item");
    }
  };

  renderHeaderButtons() {
    const { step } = this.state;

    return (
      <div style={{ position: "absolute", top: 20, right: 24 }}>
        {step > 1 && (
          <Button appearance="subtle" onClick={this.prevStep}>
            Back
          </Button>
        )}
      </div>
    );
  }

  render() {
    const { isOpen, onClose } = this.props;
    const { step, formData } = this.state;

    return (
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="medium"
        label="Add Inventory Item"
      >
        {this.renderHeaderButtons()}

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 0 }}>
            <PageHeader>
              {step === 1 && "Add Item"}
              {step === 2 && "Add Documentation"}
              {step === 3 && "Review Item"}
            </PageHeader>
          </div>

          <div
            style={{
              marginTop: -10,   // pulls it closer
              fontSize: 14,
              color: "#6B778C",
            }}
          >
            <span style={{ color: "#DE350B", fontWeight: 600 }}>*</span>{" "}
            indicates a required field
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <Form<AddItemFormValues>
              onSubmit={(values) => this.nextStep(values)}
            >
              {({ formProps }) => (
                <form {...formProps}>
                  <FormHeader>
                    <Button type="submit" appearance="primary">
                      Next
                    </Button>
                  </FormHeader>

                  <Field name="itemDescription" label="Item Description" isRequired>
                    {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Add item description" />}
                  </Field>

                  <Field name="referenceNumber" label="Reference Number">
                    {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Add reference number" />}
                  </Field>

                  <Field name="manufacturer" label="Manufacturer">
                    {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Add manufacturer" />}
                  </Field>

                  <Field name="lotNumber" label="Lot Number">
                    {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Add lot number" />}
                  </Field>

                  <Field name="expiration" label="Expiration Date" isRequired>
                    {({ fieldProps }) => (
                      <Textfield {...fieldProps} type="date" />
                    )}
                  </Field>

                  <div style={{ display: "flex", gap: 16 }}>
                    {/* Unit of Measure */}
                    <div style={{ flex: 1 }}>
                      <Field name="unitOfMeasure" label="Unit of Measure" isRequired>
                        {({ fieldProps }) => (
                          <Select<UnitOption>
                            options={[
                              { label: "Each", value: "Each" },
                              { label: "Box", value: "Box" },
                              { label: "Case", value: "Case" },
                              { label: "Pack", value: "Pack" },
                              { label: "Bottle", value: "Bottle" },
                            ]}
                            placeholder="Select unit"
                            value={
                              fieldProps.value
                                ? { label: fieldProps.value, value: fieldProps.value }
                                : null
                            }
                            onChange={(option: UnitOption | null) => {
                              fieldProps.onChange(option?.value);
                            }}
                          />
                        )}
                      </Field>
                    </div>

                    {/* Typical Shelf Life */}
                    <div style={{ flex: 1 }}>
                      <Field name="typicalShelfLife" label="Typical Shelf Life">
                        {({ fieldProps }) => (
                          <Textfield
                            {...fieldProps}
                            placeholder="Add Shelf Life"
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                </form>
              )}
            </Form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <Form<AddItemFormValues>
              onSubmit={(values) => this.nextStep(values)}
            >
              {({ formProps }) => (
                <form {...formProps}>
                  <FormHeader>
                    <Button type="submit" appearance="primary">
                      Next
                    </Button>
                  </FormHeader>

                  <Field name="marketValue" label="Market Value per Unit" isRequired>
                    {({ fieldProps }) => (
                      <Textfield {...fieldProps} type="number" />
                    )}
                  </Field>

                  <Field name="validationSource" label="Validation Source" isRequired>
                    {({ fieldProps }) => <Textfield {...fieldProps} />}
                  </Field>

                  <Field name="acquisitionMethod" label="Acquisition Method" isRequired>
                    {({ fieldProps }) => (
                      <Select<AcquisitionOption>
                        options={[
                          { label: "Purchased", value: "Purchased" },
                          { label: "Donated", value: "Donated" },
                        ]}
                        placeholder="Select acquisition method"
                        value={
                          fieldProps.value
                            ? {
                                label: fieldProps.value,
                                value: fieldProps.value,
                              }
                            : null
                        }
                        onChange={(option: AcquisitionOption | null) => {
                          fieldProps.onChange(option?.value);
                        }}
                      />
                    )}
                  </Field>
                  <Field name="document" label="Upload Document">
                    {({ fieldProps }) => (
                      <input
                        type="file"
                        onChange={(e) =>
                          this.setState({
                            formData: {
                              ...this.state.formData,
                              document: e.target.files?.[0],
                            },
                          })
                        }
                      />
                    )}
                  </Field>
                </form>
              )}
            </Form>
          )}

          {/* STEP 3 - REVIEW */}
          {step === 3 && (
            <>
              <div style={{ marginTop: 24 }}>
                <Button appearance="primary" onClick={this.handleFinalSubmit}>
                  Confirm & Add Item
                </Button>
              </div>
              <div style={{ lineHeight: 1.8 }}>
                <strong>Description:</strong> {formData.itemDescription} <br />
                <strong>Manufacturer:</strong> {formData.manufacturer} <br />
                <strong>Reference #:</strong> {formData.referenceNumber} <br />
                <strong>Expiration:</strong> {formData.expiration} <br />
                <strong>Market Value:</strong> ${formData.marketValue} <br />
                <strong>Validation Source:</strong> {formData.validationSource} <br />
                <strong>Acquisition Method:</strong> {formData.acquisitionMethod} <br />
                <strong>Document:</strong>{" "}
                {formData.document?.name || "None"}
              </div>
            </>
          )}
        </div>
      </Drawer>
    );
  }
}