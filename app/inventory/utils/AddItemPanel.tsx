// AddItemPanel.tsx
"use client";

import React from "react";
import Drawer from "@atlaskit/drawer";
import Button from "@atlaskit/button/new";
import Form, {
  Field,
  FormFooter,
  ErrorMessage,
  MessageWrapper,
  ValidMessage,
} from "@atlaskit/form";
import Textfield from "@atlaskit/textfield";
import { InventoryItem } from "../types";

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
  expiration: string; // <-- string because HTML date input returns string
}

export default class AddItemPanel extends React.Component<AddItemPanelProps> {
  handleAdd = (values: AddItemFormValues) => {
    const { itemDescription, manufacturer, referenceNumber, expiration } =
      values;
    const { items, setItems, onClose, setError } = this.props;

    try {
      const newItem: InventoryItem = {
        id: Date.now(),
        item_description: itemDescription,
        manufacturer,
        reference_number: referenceNumber,
        expiration: expiration ? new Date(expiration) : undefined,
      };

      setItems([newItem, ...items]);
      setError(null);

      onClose();
    } catch (err) {
      setError("Failed to add item");
    }
  };

  render() {
    const { isOpen, onClose } = this.props;

    return (
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="medium"
        label="Add Inventory Item"
      >
        <div style={{ padding: 24 }}>
          <h2>Add Inventory Item</h2>

          <Form<AddItemFormValues>
            onSubmit={this.handleAdd}
            name="add-item-form"
          >
            {({ formProps }) => (
              <form
                {...formProps}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Item Description */}
                <Field<string>
                  name="itemDescription"
                  label="Item Description"
                  defaultValue=""
                  isRequired
                  validate={(value) =>
                    !value ? "Item description is required" : undefined
                  }
                >
                  {({ fieldProps, meta }) => (
                    <>
                      <Textfield {...fieldProps} />
                      <MessageWrapper>
                        {meta.valid && meta.touched && (
                          <ValidMessage>Looks good!</ValidMessage>
                        )}
                        {meta.error && meta.touched && (
                          <ErrorMessage>{meta.error}</ErrorMessage>
                        )}
                      </MessageWrapper>
                    </>
                  )}
                </Field>

                {/* Manufacturer */}
                <Field<string>
                  name="manufacturer"
                  label="Manufacturer"
                  defaultValue=""
                  isRequired
                  validate={(value) =>
                    !value ? "Manufacturer is required" : undefined
                  }
                >
                  {({ fieldProps, meta }) => (
                    <>
                      <Textfield {...fieldProps} />
                      <MessageWrapper>
                        {meta.valid && meta.touched && (
                          <ValidMessage>Looks good!</ValidMessage>
                        )}
                        {meta.error && meta.touched && (
                          <ErrorMessage>{meta.error}</ErrorMessage>
                        )}
                      </MessageWrapper>
                    </>
                  )}
                </Field>

                {/* Reference Number */}
                <Field<string>
                  name="referenceNumber"
                  label="Reference Number"
                  defaultValue=""
                  isRequired
                  validate={(value) =>
                    !value ? "Reference number is required" : undefined
                  }
                >
                  {({ fieldProps, meta }) => (
                    <>
                      <Textfield {...fieldProps} />
                      <MessageWrapper>
                        {meta.valid && meta.touched && (
                          <ValidMessage>Looks good!</ValidMessage>
                        )}
                        {meta.error && meta.touched && (
                          <ErrorMessage>{meta.error}</ErrorMessage>
                        )}
                      </MessageWrapper>
                    </>
                  )}
                </Field>

                {/* Expiration Date */}
                <Field<string>
                  name="expiration"
                  label="Expiration Date"
                  defaultValue=""
                  isRequired
                  validate={(value) =>
                    !value ? "Expiration date is required" : undefined
                  }
                >
                  {({ fieldProps, meta }) => (
                    <>
                      <Textfield {...fieldProps} type="date" />
                      <MessageWrapper>
                        {meta.valid && meta.touched && (
                          <ValidMessage>Looks good!</ValidMessage>
                        )}
                        {meta.error && meta.touched && (
                          <ErrorMessage>{meta.error}</ErrorMessage>
                        )}
                      </MessageWrapper>
                    </>
                  )}
                </Field>

                <FormFooter>
                  <Button type="submit" appearance="primary">
                    Add Item
                  </Button>
                </FormFooter>
              </form>
            )}
          </Form>
        </div>
      </Drawer>
    );
  }
}
