"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";
import styles from "../login/login.module.css";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) setMessage(error.message);
    else setMessage("Password updated! You can now log in.");
  };

  return (
  <div
    style={{
      minHeight: "80vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingTop: "120px",
      background: "#f5f5f7",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "500px",
        background: "white",
        padding: "36px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "32px",
          fontSize: "40px",
          fontWeight: "700",
        }}
      >
        Choose new password
      </h1>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "18px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          marginBottom: "28px",
        }}
      />

      <button
        onClick={handleUpdate}
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "20px",
          fontWeight: "600",
          borderRadius: "8px",
          border: "none",
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        Update Password
      </button>

      {message && (
        <p
          style={{
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          {message}
        </p>
      )}

      <div style={{ textAlign: "center" }}>
        <Link href="/login">Back to login</Link>
      </div>
    </div>
  </div>
);
}