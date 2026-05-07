import React, { useEffect, useState } from "react";
import { JsonRpcProvider, Contract } from "ethers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC_URL = "http://127.0.0.1:8545";

const ABI = [
  "function getCandidate(uint256 _candidateId) external view returns (uint256 id, string memory name, uint256 voteCount, bool exists)"
];

export default function Results() {
  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [election, setElection] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      setMessage("");

      if (!CONTRACT_ADDRESS) {
        setMessage("Contract address is missing in client/.env");
        setLoading(false);
        return;
      }

      const electionRes = await fetch(`${API_URL}/voter/election`);
      const electionData = await electionRes.json();
      setElection(electionData);

      if (!electionData || !electionData.isEnded) {
        setMessage("Results are available only after the election has ended.");
        setLoading(false);
        return;
      }

      const candidatesRes = await fetch(`${API_URL}/voter/candidates`);
      const candidatesData = await candidatesRes.json();

      const provider = new JsonRpcProvider(RPC_URL);
      const code = await provider.getCode(CONTRACT_ADDRESS);

      console.log("Results contract address:", CONTRACT_ADDRESS);
      console.log("Code at address:", code);

      if (code === "0x") {
        setMessage("No contract found. Check deployment and contract address.");
        setLoading(false);
        return;
      }

      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);

      const enrichedResults = [];

      for (const candidate of candidatesData) {
        try {
          const result = await contract.getCandidate(candidate.candidateId);

          enrichedResults.push({
            candidateId: Number(result[0]),
            name: candidate.name,
            party: candidate.party,
            manifesto: candidate.manifesto,
            voteCount: Number(result[2])
          });
        } catch (error) {
          console.log(`Candidate ${candidate.candidateId} not found on-chain`, error);
        }
      }

      enrichedResults.sort((a, b) => b.voteCount - a.voteCount);

      setResults(enrichedResults);
      setWinner(enrichedResults.length > 0 ? enrichedResults[0] : null);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setMessage("Failed to load results");
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Election Results</h2>

        {loading && <p>Loading results...</p>}
        {!loading && message && <p>{message}</p>}

        {!loading && !message && winner && (
          <div className="card" style={{ border: "2px solid #16a34a" }}>
            <h3>Winner</h3>
            <p><strong>{winner.name}</strong></p>
            <p>Party: {winner.party}</p>
            <p>Total Votes: {winner.voteCount}</p>
          </div>
        )}
      </div>

      {!loading && !message && (
        <div className="grid grid-2">
          {results.map((candidate) => (
            <div className="card" key={candidate.candidateId}>
              <h3>{candidate.name}</h3>
              <p><strong>Party:</strong> {candidate.party}</p>
              <p>{candidate.manifesto}</p>
              <p><strong>Votes:</strong> {candidate.voteCount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}