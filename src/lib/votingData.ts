export interface Candidate {
  id: string;
  name: string;
  party: string;
  avatar: string;
  manifesto: string;
  votes: number;
  color: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  status: "upcoming" | "active" | "completed";
  startDate: string;
  endDate: string;
  totalVoters: number;
  votesCast: number;
  candidates: Candidate[];
}

export interface BlockchainTransaction {
  hash: string;
  timestamp: string;
  type: "vote" | "registration" | "audit";
  status: "confirmed" | "pending";
  block: number;
}

export const mockElections: Election[] = [
  {
    id: "el-001",
    title: "National Presidential Election 2026",
    description: "General election for the office of President",
    status: "active",
    startDate: "2026-04-01",
    endDate: "2026-04-10",
    totalVoters: 1250000,
    votesCast: 487320,
    candidates: [
      { id: "c1", name: "Amara Okafor", party: "Progressive Alliance", avatar: "AO", manifesto: "Economic reform, renewable energy, digital infrastructure", votes: 198450, color: "hsl(230, 80%, 55%)" },
      { id: "c2", name: "Daniel Mensah", party: "Unity Coalition", avatar: "DM", manifesto: "Healthcare access, education reform, social welfare", votes: 156200, color: "hsl(170, 60%, 45%)" },
      { id: "c3", name: "Sofia Reyes", party: "Green Future", avatar: "SR", manifesto: "Climate action, sustainable agriculture, green jobs", votes: 88430, color: "hsl(152, 60%, 42%)" },
      { id: "c4", name: "James Whitfield", party: "Independent", avatar: "JW", manifesto: "Government transparency, anti-corruption, judicial reform", votes: 44240, color: "hsl(260, 70%, 58%)" },
    ],
  },
  {
    id: "el-002",
    title: "City Council Election – District 7",
    description: "Local council representative election",
    status: "upcoming",
    startDate: "2026-05-15",
    endDate: "2026-05-20",
    totalVoters: 45000,
    votesCast: 0,
    candidates: [
      { id: "c5", name: "Maria Chen", party: "Community First", avatar: "MC", manifesto: "Local infrastructure, public safety", votes: 0, color: "hsl(230, 80%, 55%)" },
      { id: "c6", name: "Robert Adeyemi", party: "Progress Party", avatar: "RA", manifesto: "Small business support, housing reform", votes: 0, color: "hsl(170, 60%, 45%)" },
    ],
  },
  {
    id: "el-003",
    title: "Senate By-Election – Region North",
    description: "By-election for vacant Senate seat",
    status: "completed",
    startDate: "2026-03-01",
    endDate: "2026-03-05",
    totalVoters: 320000,
    votesCast: 241600,
    candidates: [
      { id: "c7", name: "Fatima Al-Hassan", party: "Reform Movement", avatar: "FA", manifesto: "Legislative transparency, constituency development", votes: 134200, color: "hsl(230, 80%, 55%)" },
      { id: "c8", name: "Patrick Nwosu", party: "National Front", avatar: "PN", manifesto: "Security, trade partnerships, fiscal responsibility", votes: 107400, color: "hsl(170, 60%, 45%)" },
    ],
  },
];

export const mockTransactions: BlockchainTransaction[] = [
  { hash: "0x7a3f...e91d", timestamp: "2026-04-04T10:23:15Z", type: "vote", status: "confirmed", block: 18420156 },
  { hash: "0x1b8c...f4a2", timestamp: "2026-04-04T10:22:58Z", type: "vote", status: "confirmed", block: 18420155 },
  { hash: "0x9d2e...b7c3", timestamp: "2026-04-04T10:22:41Z", type: "registration", status: "confirmed", block: 18420154 },
  { hash: "0x4f6a...d8e1", timestamp: "2026-04-04T10:22:30Z", type: "vote", status: "pending", block: 18420153 },
  { hash: "0x2c5d...a9f0", timestamp: "2026-04-04T10:22:12Z", type: "audit", status: "confirmed", block: 18420152 },
  { hash: "0x8e1b...c3d7", timestamp: "2026-04-04T10:21:55Z", type: "vote", status: "confirmed", block: 18420151 },
  { hash: "0x3a9f...e2b4", timestamp: "2026-04-04T10:21:30Z", type: "vote", status: "confirmed", block: 18420150 },
  { hash: "0x6d4c...f1a8", timestamp: "2026-04-04T10:21:10Z", type: "registration", status: "confirmed", block: 18420149 },
];

export const systemStats = {
  totalElections: 12,
  activeElections: 1,
  registeredVoters: 1615000,
  totalVotesCast: 728920,
  blockchainBlocks: 18420156,
  uptime: 99.97,
  averageVerificationTime: 2.3,
  encryptionStrength: "AES-256-GCM",
};
