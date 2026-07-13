"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";
import { ensureAccountForReset } from "./actions";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      // Create the account first if this email is new; existing accounts are
      // left as-is. Either way there's now a user for the recovery email.
      await ensureAccountForReset(email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) setMessage(error.message);
      else setMessage("Check your email for the reset link!");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/mending.logo.png" alt="Mending Kids" width={220} height={110} />
        </div>

        <div className={styles.title}>Reset password</div>

        <div className={styles.field}>
          <label className={styles.label}>
            Email<span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          className={styles.button}
          type="button"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Email"}
        </button>

        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.linkRow}>
          <Link className={styles.link} href="/login">
            Back to login
          </Link>
        </div>

        <div className={styles.footer}>Website created by Nova, Tech for Good</div>
      </div>
    </div>
  );
}
