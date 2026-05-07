// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Election {
    address public admin;
    bool public electionStarted;
    bool public electionEnded;
    uint256 public candidatesCount;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
        bool exists;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyWhenActive() {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Election ended");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addCandidate(uint256 _id, string memory _name) external onlyAdmin {
        require(!electionStarted, "Cannot add after start");
        require(!candidates[_id].exists, "Candidate exists");
        candidates[_id] = Candidate(_id, _name, 0, true);
        candidatesCount += 1;
    }

    function startElection() external onlyAdmin {
        require(!electionStarted, "Already started");
        require(candidatesCount > 0, "No candidates");
        electionStarted = true;
        electionEnded = false;
    }

    function endElection() external onlyAdmin {
        require(electionStarted, "Not started");
        require(!electionEnded, "Already ended");
        electionEnded = true;
    }

    function vote(uint256 _candidateId) external onlyWhenActive {
        require(!hasVoted[msg.sender], "Already voted");
        require(candidates[_candidateId].exists, "Candidate not found");
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;
    }
}
