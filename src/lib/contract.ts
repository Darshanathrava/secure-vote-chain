import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from './constants';

declare global {
  interface Window {
    ethereum: any;
  }
}

// Minimal ABI — no JSON import needed
const VOTING_ABI = [
  "function vote(uint256 _candidateId)",
  "function getCandidate(uint256 _id) view returns (uint256, string, string, uint256)",
  "function candidatesCount() view returns (uint256)",
  "function hasVoted(address) view returns (bool)",
  "function addCandidate(string memory _name, string memory _party)",
  "function closeVoting()",
  "function votingOpen() view returns (bool)"
];

async function getContract(withSigner = false) {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signerOrProvider = withSigner ? await provider.getSigner() : provider;
  return new ethers.Contract(CONTRACT_ADDRESS, VOTING_ABI, signerOrProvider);
}

export async function castVote(candidateId: number): Promise<string> {
  const contract = await getContract(true);
  const tx: any = await contract.vote(candidateId);
  await tx.wait();
  return (tx.hash ?? '') as string;
}

export async function getCandidateVotes(candidateId: number) {
  const contract = await getContract(false);
  const result: any = await contract.getCandidate(candidateId);
  return {
    id: Number(result[0]),
    name: String(result[1]),
    party: String(result[2]),
    voteCount: Number(result[3]),
  };
}

export async function getTotalCandidates(): Promise<number> {
  const contract = await getContract(false);
  const count: any = await contract.candidatesCount();
  return Number(count);
}

export async function checkHasVoted(address: string): Promise<boolean> {
  const contract = await getContract(false);
  const result: any = await contract.hasVoted(address);
  return Boolean(result);
}

export async function isVotingOpen(): Promise<boolean> {
  const contract = await getContract(false);
  const result: any = await contract.votingOpen();
  return Boolean(result);
}

export async function addCandidate(name: string, party: string): Promise<string> {
  const contract = await getContract(true);
  const tx: any = await contract.addCandidate(name, party);
  await tx.wait();
  return (tx.hash ?? '') as string;
}

export async function closeVoting(): Promise<string> {
  const contract = await getContract(true);
  const tx: any = await contract.closeVoting();
  await tx.wait();
  return (tx.hash ?? '') as string;
}

export async function getAllCandidates() {
  const total = await getTotalCandidates();
  const candidates = [];
  for (let i = 1; i <= total; i++) {
    const candidate = await getCandidateVotes(i);
    candidates.push(candidate);
  }
  return candidates;
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  const accounts: any = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  return accounts[0] as string;
}

export async function getWalletAddress(): Promise<string | null> {
  if (!window.ethereum) return null;
  const accounts: any = await window.ethereum.request({
    method: 'eth_accounts',
  });
  return accounts.length > 0 ? accounts[0] : null;
}