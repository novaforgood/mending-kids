"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setMessage(error.message);
    else setMessage("Check your email for the reset link!");
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
        Reset password
      </h1>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
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
        onClick={handleReset}
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
        Send Reset Email
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