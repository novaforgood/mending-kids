"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "../login/signup.css"; 
import { supabase } from "@/lib/supabase/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSignup = async () => {
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) setMsg("Check your email to confirm your account.");
    else setMsg("Account created! You can log in now.");

    setLoading(false);
  };

  return (
    <div className="signup-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrapper">
          <Image src="/logo.png" alt="Mending Kids Logo" width={120} height={120} className="login-logo" />
        </div>

        {/* Title */}
        <h1 className="login-title">Create your account</h1>

        {/* Form */}
        <label className="login-label">Email</label>
        <input
          className="login-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="login-label">Password</label>
        <input
          className="login-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" type="button" onClick={handleSignup} disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        {msg && <p className="login-help" style={{ marginTop: 10 }}>{msg}</p>}

        <p className="login-help" style={{ marginTop: 12 }}>
          Already have an account?{" "}
          <Link href="/login" className="login-link">
            Log in
          </Link>
        </p>

        {/* Bottom-right Nova pill */}
        <div className="nova-pill">
          <span className="nova-pill-text">Website created by Nova, Tech for Good</span>
          <Image src="/nova.png" alt="Nova Logo" width={18} height={18} className="nova-pill-icon" />
        </div>
      </div>
    </div>
  );
}
