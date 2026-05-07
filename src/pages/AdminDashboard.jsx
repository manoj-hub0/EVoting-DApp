import React, { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [candidate, setCandidate] = useState({
    candidateId: "",
    name: "",
    party: "",
    manifesto: "",
    imageUrl: ""
  });

  const token = localStorage.getItem("token");

  const loadData = async () => {
    try {
      const statsRes = await fetch("http://localhost:5001/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();

      const voterRes = await fetch("http://localhost:5001/api/admin/voters", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const voterData = await voterRes.json();

      const candidateRes = await fetch("http://localhost:5001/api/admin/candidates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const candidateData = await candidateRes.json();

      setStats(statsData);
      setVoters(voterData);
      setCandidates(candidateData);
    } catch (error) {
      console.log("Admin dashboard load error:", error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`http://localhost:5001/api/admin/voters/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      loadData();
    } catch (error) {
      console.log("Status update error:", error);
    }
  };

  const addCandidate = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...candidate,
          candidateId: Number(candidate.candidateId)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add candidate");
        return;
      }

      alert("Candidate added successfully");

      setCandidate({
        candidateId: "",
        name: "",
        party: "",
        manifesto: "",
        imageUrl: ""
      });

      loadData();
    } catch (error) {
      console.log("Add candidate error:", error);
      alert("Failed to connect to server");
    }
  };

  const updateElection = async (payload) => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/election", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update election");
        return;
      }

      alert("Election status updated");
      loadData();
    } catch (error) {
      console.log("Election update error:", error);
      alert("Failed to connect to server");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button
          className="btn btn-dark"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>

      <div className="card">
        <h2>Admin Dashboard</h2>

        {stats && (
          <div className="grid grid-3">
            <div className="card">
              <h3>{stats.totalUsers}</h3>
              <p>Total Voters</p>
            </div>

            <div className="card">
              <h3>{stats.approvedUsers}</h3>
              <p>Approved Voters</p>
            </div>

            <div className="card">
              <h3>{stats.pendingUsers}</h3>
              <p>Pending Approvals</p>
            </div>

            <div className="card">
              <h3>{stats.totalCandidates || 0}</h3>
              <p>Total Candidates</p>
            </div>

            <div className="card">
              <h3>{stats.totalVoted || 0}</h3>
              <p>Total Votes Recorded</p>
            </div>

            <div className="card">
              <h3>
                {stats.election?.isEnded
                  ? "Ended"
                  : stats.election?.isActive
                  ? "Active"
                  : "Inactive"}
              </h3>
              <p>Election Status</p>
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: "12px" }}>
          <button
            className="btn btn-success"
            onClick={() => updateElection({ isActive: true, isEnded: false })}
          >
            Start Election
          </button>

          <button
            className="btn btn-danger"
            onClick={() => updateElection({ isActive: false, isEnded: true })}
          >
            End Election
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Add Candidate</h3>

          <label>Candidate ID</label>
          <input
            className="input"
            value={candidate.candidateId}
            onChange={(e) =>
              setCandidate({ ...candidate, candidateId: e.target.value })
            }
            placeholder="Enter candidate ID"
          />

          <label>Name</label>
          <input
            className="input"
            value={candidate.name}
            onChange={(e) =>
              setCandidate({ ...candidate, name: e.target.value })
            }
            placeholder="Enter candidate name"
          />

          <label>Party</label>
          <input
            className="input"
            value={candidate.party}
            onChange={(e) =>
              setCandidate({ ...candidate, party: e.target.value })
            }
            placeholder="Enter party name"
          />

          <label>Manifesto</label>
          <textarea
            className="textarea"
            value={candidate.manifesto}
            onChange={(e) =>
              setCandidate({ ...candidate, manifesto: e.target.value })
            }
            placeholder="Enter candidate manifesto"
          />

          <label>Image URL</label>
          <input
            className="input"
            value={candidate.imageUrl}
            onChange={(e) =>
              setCandidate({ ...candidate, imageUrl: e.target.value })
            }
            placeholder="Optional image URL"
          />

          <button className="btn btn-primary" onClick={addCandidate}>
            Add Candidate
          </button>
        </div>

        <div className="card">
          <h3>Candidate List</h3>

          {candidates.length === 0 ? (
            <p>No candidates added yet.</p>
          ) : (
            candidates.map((item) => (
              <div key={item._id} className="card">
                <p>
                  <strong>
                    {item.candidateId}. {item.name}
                  </strong>
                </p>
                <p>{item.party}</p>
                <p>{item.manifesto}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h3>Voter Approvals</h3>

        {voters.length === 0 ? (
          <p>No voters registered yet.</p>
        ) : (
          voters.map((voter) => (
            <div key={voter._id} className="card">
              <p>
                <strong>{voter.name}</strong>
              </p>
              <p>{voter.email}</p>
              <p>{voter.studentId}</p>
              <p>{voter.walletAddress}</p>
              <p>
                <span className="badge">{voter.status}</span>
              </p>

              <div className="row">
                <button
                  className="btn btn-success"
                  onClick={() => updateStatus(voter._id, "approved")}
                >
                  Approve
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => updateStatus(voter._id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}