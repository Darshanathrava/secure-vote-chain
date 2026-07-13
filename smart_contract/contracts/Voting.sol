// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        string party;
        uint voteCount;
    }

    address public admin;
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    uint public candidatesCount;
    bool public votingOpen;

    event VoteCast(address indexed voter, uint indexed candidateId);

    constructor() { admin = msg.sender; votingOpen = true; }

    modifier onlyAdmin() { require(msg.sender == admin, "Not admin"); _; }

    function addCandidate(string memory _name, string memory _party) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _party, 0);
    }

    function vote(uint _candidateId) public {
        require(votingOpen, "Voting is closed");
        require(!hasVoted[msg.sender], "Already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        emit VoteCast(msg.sender, _candidateId);
    }

    function getCandidate(uint _id) public view returns (uint, string memory, string memory, uint) {
        Candidate memory c = candidates[_id];
        return (c.id, c.name, c.party, c.voteCount);
    }

    function closeVoting() public onlyAdmin { votingOpen = false; }
}