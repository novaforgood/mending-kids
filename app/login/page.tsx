// app/login/page.tsx
"use client";

import Image from "next/image";
import "./signup.css"; // only works if this CSS is treated as global; if it errors, use Option B below

export default function LoginPage() {
  return (
    <div className="signup-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrapper">
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={120}
            className="login-logo"
          />
        </div>

        {/* Heading */}
        <h1 className="login-title">Welcome back!</h1>

        {/* Form */}
        <label className="login-label">Username</label>
        <input className="login-input" type="text" />

        <label className="login-label">Password</label>
        <input className="login-input" type="password" />

        <button className="login-button">Log In</button>

        {/* Footer link */}
        <p className="login-help">
          Don&apos;t know your login? Contact{" "}
          <a href="#" className="login-link">
            Mending Kids
          </a>
          .
        </p>

        {/* Bottom-right Nova pill */}
        <div className="nova-pill">
          <span className="nova-pill-text">
            Website created by Nova, Tech for Good
          </span>
          <Image
            src="/nova.png"
            alt="Nova Logo"
            width={18}
            height={18}
            className="nova-pill-icon"
          />
        </div>
      </div>
    </div>
  );
}
