import React from "react";
import "./Signup.css";
import logo from "../Assets/logo.png";
import novaLogo from "../Assets/nova.svg";   


export default function Signup() {
  return (
    <div className="signup-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo-wrapper">
          <img className="login-logo" src={logo} alt="Mending Kids Logo" />

        </div>

        {/* Heading */}
        <h1 className="login-heading">
          Welcome back, <br />
          Mending Kids
        </h1>

        {/* Form */}
        <div className="login-form">

          <label className="login-label">
            Username
            <input
              type="text"
              className="login-input"
            />
          </label>

          <label className="login-label">
            Password
            <input
              type="password"
              className="login-input"
            />
          </label>
        </div>

        {/* Button */}
        <button className="login-button">Log In</button>

        {/* Help text */}
        <p className="login-help">
          Don’t know your login? Contact{" "}
          <a href="#" className="login-link">
            Mending Kids
          </a>
        </p>
      </div>

      {/* Bottom-right Nova pill */}
      <div className="nova-pill">
        <span className="nova-pill-text">Website created by Nova, Tech for Good</span>
        <img src={novaLogo} alt="Nova Logo" className="nova-pill-icon" />
      </div>
    </div>
  );
}
