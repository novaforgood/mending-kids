"use client";

import React, { useEffect, useState } from "react";
import Button from "@atlaskit/button/new";
import Form, { Field, FormFooter } from "@atlaskit/form";
import Textfield from "@atlaskit/textfield";
import SidePanel, { PanelLabel } from "@/components/SidePanel";
import { addMissionMember } from "../actions";

type Props = {
  isOpen: boolean;
  missionId: number;
  onClose: () => void;
  onAdded: () => void;
};

type FormValues = {
  name: string;
  contact: string;
  role: string;
};

export default function AddMemberPanel({ isOpen, missionId, onClose, onAdded }: Props) {
  const [formFilled, setFormFilled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) setFormFilled(false);
  }, [isOpen]);

  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await addMissionMember({
        mission_id: missionId,
        name: values.name.trim(),
        contact: values.contact.trim() || null,
        role: values.role.trim() || null,
        form_filled: formFilled,
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      label="Add Member"
      title="Add Member"
      subtitle="* indicates a required field"
      footerLeft={<span />}
      footerRight={<span />}
    >
      <Form<FormValues> onSubmit={handleSubmit}>
        {({ formProps, submitting }) => (
          <form {...formProps} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: "16px 0 0 0",
              }}
            >
              <div>
                <PanelLabel required>Name</PanelLabel>
                <Field<string> name="name" defaultValue="" isRequired>
                  {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Full name" />}
                </Field>
              </div>

              <div>
                <PanelLabel>Contact</PanelLabel>
                <Field<string> name="contact" defaultValue="">
                  {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Phone or email" />}
                </Field>
              </div>

              <div>
                <PanelLabel>Role</PanelLabel>
                <Field<string> name="role" defaultValue="">
                  {({ fieldProps }) => (
                    <Textfield {...fieldProps} placeholder="e.g. Volunteer, Medical Doctor" />
                  )}
                </Field>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={formFilled}
                    onChange={(e) => setFormFilled(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 14, color: "#172b4d" }}>Form filled</span>
                </label>
              </div>
            </div>

            <FormFooter>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderTop: "1px solid #e4e6ea", paddingTop: 12, marginTop: 12 }}>
                <Button appearance="subtle" onClick={onClose} isDisabled={saving || submitting}>
                  Cancel
                </Button>
                <Button type="submit" appearance="primary" isLoading={saving || submitting}>
                  Add Member
                </Button>
              </div>
            </FormFooter>
          </form>
        )}
      </Form>
    </SidePanel>
  );
}
