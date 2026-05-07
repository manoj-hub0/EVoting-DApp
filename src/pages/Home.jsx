import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <div className="navbar">
        <div className="navbar-inner">
          <div className="brand">UEL E-Voting DApp</div>
          <div className="nav-links">
            <Link to="/login" style={{ color: "white" }}>Login</Link>
            <Link to="/register" style={{ color: "white" }}>Register</Link>
            <Link to="/results" className="btn btn-success">View Results</Link>
          </div>
        </div>
      </div>

      <div className="container hero">
        <div className="card">
          <h1>Secure University E-Voting Platform</h1>
          <p>
            A hybrid blockchain voting system with voter registration, admin approval,
            candidate management, and wallet-based secure voting using MetaMask.
          </p>

          <div className="row" style={{ marginTop: "20px" }}>
            <Link to="/register" className="btn btn-primary">Register as Voter</Link>
            <Link to="/login" className="btn btn-dark">Login</Link>
          </div>
        </div>

        <div className="grid grid-3">
          <div className="card">
            <h3>Blockchain Security</h3>
            <p>Votes are protected with smart contract logic and one-wallet-one-vote enforcement.</p>
          </div>
          <div className="card">
            <h3>Admin Control</h3>
            <p>Admins can approve voters, manage candidates, and start or end elections.</p>
          </div>
          <div className="card">
            <h3>Real-world Hybrid Design</h3>
            <p>Combines React, Node.js, MongoDB, Solidity, and MetaMask for a full-stack solution.</p>
          </div>
        </div>
      </div>
    </>
  );
}