"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";
import styles from "../login/login.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/mending.logo.png" alt="Mending Kids" width={220} height={110} />
        </div>

        <div className={styles.title}>Choose new password</div>

        <div className={styles.field}>
          <label className={styles.label}>
            New password<span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className={styles.button} type="button" onClick={handleUpdate}>
          Update Password
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
