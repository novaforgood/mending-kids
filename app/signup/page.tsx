"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./signup.module.css";

import { supabaseBrowser as supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    setMessage(null);

    if (!fullName.trim()) return setMessage("Please enter your full name.");
    if (!email.trim()) return setMessage("Please enter your email.");
    if (password.length < 6) return setMessage("Password must be at least 6 characters.");
    if (!role) return setMessage("Please select a role.");

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      // Some projects require email confirmation, so user may not be "active" immediately.
      if (data?.user?.identities?.length === 0) {
        setMessage("This email is already registered. Try logging in.");
        return;
      }

      setMessage("Account created! Check your email to confirm, then log in.");
    } catch (e: any) {
      setMessage(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background area */}
      <div className={styles.centerWrap}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <Image src="/mending.logo.png" alt="Mending Kids" width={260} height={120} className={styles.logo} />
          </div>

          <h2 className={styles.title}>Sign up</h2>

          <div className={styles.form}>
            <label className={styles.label}>
              Name<span className={styles.req}>*</span>
            </label>
            <input
              className={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />

            <label className={styles.label}>
              Email<span className={styles.req}>*</span>
            </label>
            <input
              className={styles.input}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
            />

            <label className={styles.label}>
              Password<span className={styles.req}>*</span>
            </label>
            <input
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />

            <label className={styles.label}>
              Role<span className={styles.req}>*</span>
            </label>
            <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="intern">Intern</option>
            </select>

            <button className={styles.button} type="button" onClick={handleSignup} disabled={loading}>
              {loading ? "Creating..." : "Continue"}
            </button>

            {message && <p className={styles.message}>{message}</p>}

            <div className={styles.linkRow}>
              <Link className={styles.link} href="/login">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}