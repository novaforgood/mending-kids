"use client";

import React, { useEffect, useState } from "react";
import Form, { Field, FormFooter } from "@atlaskit/form";
import Textfield from "@atlaskit/textfield";
import Button from "@atlaskit/button/new";
import SidePanel, { PanelLabel } from "@/components/SidePanel";
import { fetchMissionFull, updateMission } from "../actions";
import { overlayStyle, popupStyle } from "../panelStyles";
import { useAuthUser } from "@/app/hooks/authUser";

const CATEGORIES = ["ENT", "Medical", "Dental", "Surgical", "Educational", "Other"];
const LOCATIONS = ["Guatemala", "Honduras", "Mexico", "El Salvador", "Nicaragua", "Other"];

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

type MissionPatch = {
  mission_name: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  location?: string;
};

type Props = {
  isOpen: boolean;
  missionId: number;
  onClose: () => void;
  onSaved: (patch: MissionPatch) => void;
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
  team_members: string;
  budget: string;
};

export default function EditMissionPanel({ isOpen, missionId, onClose, onSaved }: Props) {
  const [defaults, setDefaults] = useState<Partial<FormValues>>({});
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0); // force re-mount when data loads
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const { user } = useAuthUser();

  // Fetch full mission data when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    fetchMissionFull(missionId)
      .then((m) => {
        setDefaults({
          mission_name: m.mission_name ?? "",
          description: m.description ?? "",
          start_date: m.start_date ?? "",
          end_date: m.end_date ?? "",
          category: m.category ?? "",
          location: m.location ?? "",
          doctor_name: m.doctor_name ?? "",
          doctor_email: m.doctor_email ?? "",
          doctor_phone: m.doctor_phone ?? "",
          team_members: m.team_members ?? "",
          budget: m.budget != null ? String(m.budget) : "",
        });
        setFormKey((k) => k + 1); // re-mount form with fresh defaultValues
      })
      .catch(console.error);
  }, [isOpen, missionId]);

  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    if (user?.user_metadata?.role !== "admin") {
      setPopupMessage("You do not have permission to edit this.");
      setShowPopup(true);
      setSaving(false);
      return;
    }
    try {
      await updateMission(missionId, {
        mission_name: values.mission_name,
        start_date: values.start_date || undefined,
        end_date: values.end_date || undefined,
        category: values.category || undefined,
        location: values.location || undefined,
        doctor_name: values.doctor_name || undefined,
        doctor_email: values.doctor_email || undefined,
        doctor_phone: values.doctor_phone || undefined,
        budget: values.budget ? parseFloat(values.budget) : undefined,
      });
      onSaved({
        mission_name: values.mission_name,
        start_date: values.start_date || undefined,
        end_date: values.end_date || undefined,
        category: values.category || undefined,
        location: values.location || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setPopupMessage(err instanceof Error ? err.message : "Failed to save changes.");
      setShowPopup(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      label="Edit Mission"
      title="Edit Mission"
      subtitle="* indicates a required field"
      footerLeft={<span />}
      footerRight={<span />}
    >
      <Form<FormValues> key={formKey} onSubmit={handleSubmit}>
        {({ formProps, submitting }) => (
          <form
            {...formProps}
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "16px 0 0 0",
              }}
            >
              {/* Name */}
              <div>
                <PanelLabel required>Name</PanelLabel>
                <Field<string> name="mission_name" defaultValue={defaults.mission_name ?? ""} isRequired>
                  {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Mission Name" />}
                </Field>
              </div>

              {/* Description */}
              <div>
                <PanelLabel>Description</PanelLabel>
                <Field<string> name="description" defaultValue={defaults.description ?? ""}>
                  {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Description" />}
                </Field>
              </div>

              {/* Start Date + Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <PanelLabel required>Start Date</PanelLabel>
                  <Field<string> name="start_date" defaultValue={defaults.start_date ?? ""} isRequired>
                    {({ fieldProps }) => <Textfield {...fieldProps} type="date" />}
                  </Field>
                </div>
                <div>
                  <PanelLabel required>Category</PanelLabel>
                  <Field<string> name="category" defaultValue={defaults.category ?? ""} isRequired>
                    {({ fieldProps: { onChange, value, isDisabled, isInvalid, isRequired, ...rest } }) => (
                      <select
                        {...rest}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Select</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
              </div>

              {/* End Date */}
              <div>
                <PanelLabel>End Date</PanelLabel>
                <Field<string> name="end_date" defaultValue={defaults.end_date ?? ""}>
                  {({ fieldProps }) => <Textfield {...fieldProps} type="date" />}
                </Field>
              </div>

              {/* Location */}
              <div>
                <PanelLabel required>Location</PanelLabel>
                <Field<string> name="location" defaultValue={defaults.location ?? ""} isRequired>
                  {({ fieldProps: { onChange, value, isDisabled, isInvalid, isRequired, ...rest } }) => (
                    <select
                      {...rest}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">Select</option>
                      {LOCATIONS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>

              {/* Doctor Name */}
              <div>
                <PanelLabel required>Doctor Name</PanelLabel>
                <Field<string> name="doctor_name" defaultValue={defaults.doctor_name ?? ""} isRequired>
                  {({ fieldProps }) => <Textfield {...fieldProps} placeholder="Doctor Name" />}
                </Field>
              </div>

              {/* Doctor Email */}
              <div>
                <PanelLabel required>Doctor's Email</PanelLabel>
                <Field<string> name="doctor_email" defaultValue={defaults.doctor_email ?? ""} isRequired>
                  {({ fieldProps }) => (
                    <Textfield {...fieldProps} type="email" placeholder="doctor@example.com" />
                  )}
                </Field>
              </div>

              {/* Doctor Phone */}
              <div>
                <PanelLabel>Doctor's Phone</PanelLabel>
                <Field<string> name="doctor_phone" defaultValue={defaults.doctor_phone ?? ""}>
                  {({ fieldProps }) => (
                    <Textfield {...fieldProps} type="tel" placeholder="555-555-5555" />
                  )}
                </Field>
              </div>

              {/* Budget */}
              <div>
                <PanelLabel>Budget</PanelLabel>
                <Field<string> name="budget" defaultValue={defaults.budget ?? ""}>
                  {({ fieldProps }) => (
                    <Textfield
                      {...fieldProps}
                      type="number"
                      placeholder="0"
                      elemBeforeInput={
                        <span style={{ paddingLeft: 8, color: "#6b778c", fontWeight: 600, fontSize: 14 }}>
                          $
                        </span>
                      }
                    />
                  )}
                </Field>
              </div>
            </div>

            {/* Footer inside the form so submit works */}
            <FormFooter>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  borderTop: "1px solid #e4e6ea",
                  paddingTop: 12,
                  marginTop: 12,
                }}
              >
                <Button appearance="subtle" onClick={onClose} isDisabled={saving || submitting}>
                  Cancel
                </Button>
                <Button type="submit" appearance="primary" isLoading={saving || submitting}>
                  Save Changes
                </Button>
              </div>
            </FormFooter>
          </form>
        )}
      </Form>

      {showPopup && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <p>{popupMessage}</p>
            <button onClick={() => setShowPopup(false)}>OK</button>
          </div>
        </div>
      )}
    </SidePanel>
  );
}
