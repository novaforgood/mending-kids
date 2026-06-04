"use client";


import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./login.module.css";

import { supabaseBrowser as supabase } from "@/lib/supabase/client";


export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  const role = data.user?.user_metadata?.role;

if (!role) {
  console.log("User metadata:", data.user?.user_metadata);
}

window.location.href = "/dashboard";
};

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/mending.logo.png" alt="Mending Kids" width={220} height={110} />
        </div>

        <div className={styles.title}>Log in to continue</div>

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

        <div className={styles.field}>
          <label className={styles.label}>
            Password<span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <label className={styles.rememberRow}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        <button className={styles.button} type="button" onClick={handleLogin}>
          Continue
        </button>

        <div className={styles.linkRow}>
          <Link className={styles.link} href="/forgot-password">
            Forgot password?
          </Link>
          <Link className={styles.link} href="/signup">
            Create an account
          </Link>
        </div>

        <div className={styles.footer}>Website created by Nova, Tech for Good</div>
      </div>
    </div>
  );
}