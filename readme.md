# Secure Vote Chain

A full-stack electronic voting platform that combines **blockchain-based vote recording** with **biometric voter verification** (facial recognition, with an optional fingerprint step). Votes are cast as transactions on an Ethereum-compatible smart contract via MetaMask, while voter identity, election metadata and results are managed by a MongoDB-backed REST API.

The goal is to demonstrate how decentralized ledgers and biometrics can be combined into a voting system that is tamper-resistant, auditable and resistant to duplicate voting.

**Live demo:** [srcurevoting.vercel.app](https://srcurevoting.vercel.app) *(API on Render free tier, so the first request may take ~30–60 s to wake up)*

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- **Blockchain-backed voting** — votes are recorded on-chain by a Solidity contract (`Voting.sol`), so they can't be edited after the fact.
- **One-vote enforcement** — the contract tracks voter addresses (`hasVoted`) to block duplicate votes, in addition to backend checks.
- **Facial recognition verification** — the voter's live face is compared against a stored embedding using DeepFace (Facenet) before voting is allowed.
- **Fingerprint verification (in progress)** — an additional biometric step using a Mantra MFS110 scanner.
- **MetaMask integration** — voters sign and submit their vote with their own wallet through `ethers.js`.
- **Admin controls** — admins can add candidates and close voting through restricted contract functions.
- **Election management API** — REST endpoints for authentication, vote casting, vote status and active election data (Mongoose models: User, Candidate, Election).
- **Modern frontend** — Vite + React + TypeScript SPA with Tailwind CSS and Radix UI: landing, registration, authentication, voting, admin and results pages.

> **Note:** `client/` holds an earlier Create React App frontend kept for reference. The maintained frontend is in `src/`.

## Architecture

```
┌──────────────┐    REST     ┌───────────────┐   python-shell /    ┌──────────────────┐
│ React (Vite) │ ──────────▶ │ Express API   │ ──── HTTP ────────▶ │ Face service     │
│  Vercel      │             │  Render       │                     │ (Python/DeepFace)│
└──────┬───────┘             └───────┬───────┘                     └──────────────────┘
       │ ethers.js                   │ Mongoose
       ▼                             ▼
┌──────────────┐             ┌───────────────┐
│ MetaMask +   │             │ MongoDB Atlas │
│ Voting.sol   │             └───────────────┘
└──────────────┘
```

**Vote flow:** register (face enrolled) → authenticate (face verified) → connect wallet → cast vote on-chain → results read from the blockchain.

## Tech Stack

| Layer             | Technology                                                                        |
| ----------------- | --------------------------------------------------------------------------------- |
| Frontend          | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, React Router, TanStack Query  |
| Blockchain        | Solidity `^0.8.0`, Truffle, Ganache, `ethers.js`, MetaMask                        |
| Backend           | Node.js, Express, Mongoose (MongoDB)                                              |
| Auth              | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`                                      |
| Face verification | Python, OpenCV, DeepFace (Facenet embeddings)                                     |
| Fingerprint       | Mantra MFS110 (in progress)                                                       |
| Hosting           | Vercel (frontend), Render (API), MongoDB Atlas (database)                         |
| Testing           | Vitest, Testing Library                                                           |

## Project Structure

```
secure-vote-chain/
├── src/                     # Active frontend (Vite + React + TypeScript)
│   ├── pages/                 # Landing, Register, Authenticate, Vote, Admin, Results
│   ├── components/            # Shared UI and layout components
│   └── lib/                   # API client, contract bindings, constants
├── server/                  # Express backend (deploy root on Render)
│   ├── Controller/            # Auth and vote controllers
│   ├── Models/                # Mongoose schemas: User, Candidate, Election
│   ├── Routes/                # /api/auth and /api/vote routes
│   └── face_service/          # Python DeepFace scripts (encode / verify)
├── smart_contract/          # Truffle project
│   ├── contracts/             # Voting.sol, Transaction.sol
│   └── migrations/            # Deployment scripts
├── client/                  # Legacy CRA frontend (reference only)
└── dist/                    # Production build output
```

## Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** (local, or a MongoDB Atlas URI)
- **Python** 3.10–3.11 with `pip` (best DeepFace/OpenCV compatibility)
- **Truffle** (`npm install -g truffle`) and **Ganache** (GUI or CLI)
- **MetaMask** browser extension
- *(Optional)* Mantra MFS110 scanner and its RD service/drivers for the fingerprint step

## Installation

```bash
# 1. Clone
git clone https://github.com/Darshanathrava/secure-vote-chain.git
cd secure-vote-chain

# 2. Frontend dependencies
npm install

# 3. Backend dependencies
cd server && npm install && cd ..

# 4. Python face-verification dependencies
cd server
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install deepface opencv-python numpy
cd ..

# 5. Smart contract dependencies + compile
cd smart_contract && npm install && truffle compile && cd ..
```

> **Windows + dlib:** if a package needs `dlib`, use a prebuilt wheel that matches your Python version instead of compiling it from source.

## Configuration

Create `server/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
PORT=1322

EMAIL=your_notification_email@example.com
EMAILPASSWORD=your_email_app_password
```

Frontend settings:

- `CONTRACT_ADDRESS` in `src/lib/constants.ts` — update after every contract deployment.
- API base URL in `src/lib/api.ts` — defaults to `http://localhost:1322/api`; point it at your deployed API in production.

**Never commit `.env` files, private keys, or biometric data.**

## Running Locally

1. **Start Ganache** (default RPC `http://127.0.0.1:7545`).
2. **Deploy the contract:**
   ```bash
   cd smart_contract
   truffle migrate --network development
   cd ..
   ```
   Copy the deployed address into `src/lib/constants.ts`.
3. **Configure MetaMask** — Network `Localhost 7545`, RPC `http://127.0.0.1:7545`, Chain ID `1337` — and import a Ganache account.
4. **Start everything:**
   ```bash
   npm run dev          # Express API + Vite dev server via concurrently
   ```
   Or separately:
   ```bash
   npm run backend      # Express API on PORT
   npm run frontend     # Vite dev server (http://localhost:5173)
   ```

## Deployment

| Component     | Platform       | Notes                                                                 |
| ------------- | -------------- | --------------------------------------------------------------------- |
| Frontend      | Vercel         | Build with Vite; set the API base URL to the Render service.          |
| API           | Render         | Set **Root Directory** to `server`. Add the `.env` variables above in the Render dashboard. |
| Database      | MongoDB Atlas  | Allow Render's outbound IPs (or `0.0.0.0/0` for testing) in Network Access. |
| Face service  | Render (Docker) | DeepFace needs system libraries, so the Python service runs from a Docker runtime on Render. If the free tier runs out of memory, host the face step separately (e.g. Hugging Face Spaces) and call it over HTTP. |

**Free-tier caveats:** Render free instances sleep when idle, and TensorFlow/DeepFace is memory-heavy, so expect slow cold starts for face verification.

**Blockchain network:** Ganache only exists on your machine. For a public deployment, deploy `Voting.sol` to a public testnet, update `CONTRACT_ADDRESS`, and have voters switch MetaMask to that network.

## Usage Guide

1. **Register** — create a voter account; a reference face image is captured, encoded and stored against the profile.
2. **Authenticate** — a live face image is captured and verified against the stored encoding (cosine similarity threshold `0.7`). With fingerprint enabled, the scanner step follows.
3. **Connect wallet** — link MetaMask on the Vote page.
4. **Cast vote** — submits a transaction to the `Voting` contract; voter status updates once it confirms.
5. **View results** — the Results page reads live counts from the blockchain.
6. **Admin** — add candidates and close voting via the Admin page (`addCandidate`, `closeVoting`, restricted to the deploying account).

## Security Notes

- Face embeddings and biometric data are sensitive. Don't commit face images or embedding files, and store only what's needed.
- Keep `JWT_SECRET`, SMTP credentials and wallet private keys out of version control.
- This is an academic/portfolio project and has not had a formal security audit. Don't use it for real elections.

## Roadmap

- [ ] Complete Mantra MFS110 fingerprint verification
- [ ] Deploy contract to a public testnet
- [ ] Liveness detection to resist photo/video spoofing
- [ ] Screenshots / demo GIF
- [ ] CI (lint, typecheck, tests)

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/your-feature-name`
2. Follow the existing code style (TypeScript conventions on the frontend, standard Express patterns on the backend).
3. Add or update tests (`npm run test`) and run `npm run typecheck`.
4. Use clear commit messages (e.g. `feat: add candidate deletion endpoint`).
5. Open a Pull Request describing the change and how you tested it.

## License

No `LICENSE` file is included yet, so all rights are reserved by default. To open-source the project, add a license such as [MIT](https://choosealicense.com/licenses/mit/).

## Contact

**Maintainer:** Darshan Athrava
**Repository:** [github.com/Darshanathrava/secure-vote-chain](https://github.com/Darshanathrava/secure-vote-chain)

Questions or bugs? [Open an issue](https://github.com/Darshanathrava/secure-vote-chain/issues).
