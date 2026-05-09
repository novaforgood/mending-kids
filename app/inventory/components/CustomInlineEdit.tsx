"use client";

import React from "react";
import Textfield from "@atlaskit/textfield";
import CheckIcon from "@atlaskit/icon/glyph/check";
import CrossIcon from "@atlaskit/icon/glyph/cross";

interface Props {
  label: string;
  value: string;
  onSave: (value: string) => void;   // <-- IMPORTANT
  placeholder?: string;
}

interface State {
  draft: string;
  isEditing: boolean;
}

export default class CustomInlineEdit extends React.Component<Props, State> {
  state: State = {
    draft: this.props.value || "",
    isEditing: false,
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.value !== this.props.value) {
      this.setState({ draft: this.props.value || "" });
    }
  }

  startEdit = () => {
    this.setState({
      isEditing: true,
      draft: this.props.value || "",
    });
  };

  cancel = () => {
    this.setState({
      isEditing: false,
      draft: this.props.value || "",
    });
  };

  save = () => {
    this.props.onSave(this.state.draft); // 👈 THIS triggers Supabase save
    this.setState({ isEditing: false });
  };

  render() {
    const { label } = this.props;
    const { isEditing, draft } = this.state;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* LABEL */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#6B778C",
          }}
        >
          {label}
        </div>

        {/* VIEW MODE */}
        {!isEditing && (
          <div
            onClick={this.startEdit}
            style={{
              fontSize: 14,
              color: "#172B4D",
              cursor: "pointer",
              minHeight: 24,
              display: "flex",
              alignItems: "center",
            }}
          >
            {this.props.value || "-"}
          </div>
        )}

        {/* EDIT MODE */}
        {isEditing && (
          <div style={{ position: "relative" }}>
            <Textfield
              autoFocus
              value={draft}
              onChange={(e: any) =>
                this.setState({ draft: e.target.value })
              }
              onKeyDown={(e: any) => {
                if (e.key === "Enter") this.save();
                if (e.key === "Escape") this.cancel();
              }}
            />

            {/* ACTIONS */}
            <div
              style={{
                position: "absolute",
                bottom: -25,
                right: 0,
                display: "flex",
                gap: 8,
              }}
            >
              {/* ✔ SAVE */}
              <button
                onClick={this.save}
                style={{
                width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #8C8F97",
                  borderRadius: 4,
                  background: "white",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <CheckIcon label="save" />
              </button>

              {/* ✕ CANCEL */}
              <button
                onClick={this.cancel}
                style={{
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #8C8F97",
                  borderRadius: 4,
                  background: "white",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <CrossIcon label="cancel" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}