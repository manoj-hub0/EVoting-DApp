import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    walletAddress: "",
    password: ""
  });

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    setForm({ ...form, walletAddress: accounts[0] });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Registration submitted. Wait for admin approval.");
    } catch (error) {
      alert("Server connection failed");
    }
  };

  return (
    <div className="container" style={{ paddingTop: "40px" }}>
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2>Voter Registration</h2>
        <form onSubmit={handleRegister}>
          <label>Full Name</label>
          <input className="input" name="name" value={form.name} onChange={updateField} />

          <label>Email</label>
          <input className="input" name="email" type="email" value={form.email} onChange={updateField} />

          <label>Student ID</label>
          <input className="input" name="studentId" value={form.studentId} onChange={updateField} />

          <label>Wallet Address</label>
          <input className="input" name="walletAddress" value={form.walletAddress} onChange={updateField} />

          <button type="button" className="btn btn-dark" onClick={connectMetaMask}>
            Connect MetaMask
          </button>

          <div style={{ marginTop: "16px" }}>
            <label>Password</label>
            <input className="input" name="password" type="password" value={form.password} onChange={updateField} />
          </div>

          <button className="btn btn-primary" type="submit">Submit Registration</button>
        </form>

        <p style={{ marginTop: "16px" }}>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}