import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const ABI = [
  "function vote(uint256 _candidateId) external",
  "function hasVoted(address) external view returns (bool)"
];

export default function VoterDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [wallet, setWallet] = useState("");
  const [message, setMessage] = useState("");
  const [loadingVote, setLoadingVote] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const res = await fetch(`${API_URL}/voter/candidates`);
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setMessage("Failed to load candidates");
    }
  };

  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not found");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      if (!accounts || !accounts.length) {
        alert("No MetaMask account found");
        return;
      }

      setWallet(accounts[0]);
      setMessage("MetaMask connected");
    } catch (error) {
      console.log(error);
      setMessage("Failed to connect MetaMask");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleVote = async (candidateId) => {
    try {
      setLoadingVote(true);
      setMessage("");

      if (!window.ethereum) {
        alert("MetaMask not found");
        return;
      }

      if (!CONTRACT_ADDRESS) {
        alert("Contract address missing. Check client/.env and restart frontend.");
        return;
      }

      if (!user) {
        alert("Please login first");
        return;
      }

      if (user.status !== "approved") {
        alert("Your account is not approved yet");
        return;
      }

      if (user.hasVoted) {
        alert("You have already voted");
        return;
      }

      if (!wallet) {
        alert("Please connect MetaMask first");
        return;
      }

      if (wallet.toLowerCase() !== user.walletAddress.toLowerCase()) {
        alert("Connected wallet does not match your registered wallet");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId.toString() !== "31337") {
        alert("Wrong MetaMask network. Please switch to Hardhat Local (Chain ID 31337).");
        return;
      }

      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        alert("No contract found at the configured address. Redeploy and restart frontend.");
        return;
      }

      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      const alreadyVotedOnChain = await contract.hasVoted(wallet);
      if (alreadyVotedOnChain) {
        alert("This wallet has already voted on blockchain");
        return;
      }

      const tx = await contract.vote(candidateId);
      setMessage("Transaction submitted. Waiting for confirmation...");

      const receipt = await tx.wait();

      const res = await fetch(`${API_URL}/voter/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateId,
          txHash: receipt.hash
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Vote recorded on blockchain but backend update failed");
        return;
      }

      const updatedUser = {
        ...user,
        hasVoted: true
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage(`Vote successful. Transaction hash: ${receipt.hash}`);
      alert("Vote cast successfully");
      window.location.reload();
    } catch (error) {
      console.log("Vote error:", error);
      alert(error.reason || error.message || "Voting failed");
    } finally {
      setLoadingVote(false);
    }
  };

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button className="btn btn-dark" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="card">
        <h2>Voter Dashboard</h2>
        <p>Welcome, {user?.name}</p>
        <p>
          Status: <span className="badge">{user?.status || "unknown"}</span>
        </p>
        <p>
          Registered Wallet: <span className="badge">{user?.walletAddress || "not found"}</span>
        </p>
        <p>
          Connected Wallet: <span className="badge">{wallet || "Not connected"}</span>
        </p>

        <div className="row" style={{ marginTop: "12px" }}>
          <button className="btn btn-dark" onClick={connectMetaMask}>
            Connect MetaMask
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        {candidates.map((candidate) => (
          <div className="card" key={candidate._id}>
            <h3>{candidate.name}</h3>
            <p>
              <strong>Party:</strong> {candidate.party}
            </p>
            <p>{candidate.manifesto}</p>

            <button
              className="btn btn-primary"
              onClick={() => handleVote(candidate.candidateId)}
              disabled={loadingVote || user?.hasVoted}
            >
              {user?.hasVoted ? "Already Voted" : loadingVote ? "Processing..." : "Vote"}
            </button>
          </div>
        ))}
      </div>

      {message && (
        <div className="card">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}