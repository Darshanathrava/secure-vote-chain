
# Secure Vote Chain

A full-stack electronic voting platform that combines **blockchain-based vote recording** with **facial-recognition voter verification**. Votes are cast as transactions on an Ethereum-compatible smart contract (via MetaMask), while voter identity, election metadata, and results are managed through a MongoDB-backed REST API.

The goal of the project is to demonstrate how decentralized ledgers and biometric verification can be combined to build a voting system that is tamper-resistant, auditable, and resistant to duplicate voting.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Usage Guidelines](#usage-guidelines)
- [Contributing Guidelines](#contributing-guidelines)
- [License](#license)
- [Contact](#contact)
- [README Best Practices](#a-note-on-readme-best-practices)

## Features

- **Blockchain-backed voting** — Votes are recorded on-chain via a Solidity smart contract (`Voting.sol`), preventing tampering or retroactive edits once a vote is cast.
- **One-vote enforcement** — The smart contract tracks voter addresses (`hasVoted`) to prevent duplicate votes at the contract level, in addition to backend checks.
- **Facial recognition verification** — Voter identity is verified against a stored face embedding using DeepFace (Facenet model) before a vote is permitted.
- **MetaMask wallet integration** — Voters connect an Ethereum wallet (via `ethers.js`) to sign and submit their vote transaction.
- **Admin controls** — Admins can add candidates and close voting through dedicated smart contract functions.
- **Election management API** — REST endpoints for authentication, vote casting, vote status, and active election data, backed by MongoDB/Mongoose models for Users, Candidates, and Elections.
- **Modern frontend** — A Vite + React + TypeScript SPA (with Tailwind CSS and Radix UI components) provides landing, registration, authentication, voting, admin, and results pages.

> **Note:** The repository also contains a `client/` directory with an earlier Create React App–based frontend. This is retained for reference; the actively maintained frontend lives in `src/`.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, React Router, TanStack Query |
| Blockchain | Solidity `^0.8.0`, Truffle, Ganache, `ethers.js`, MetaMask |
| Backend | Node.js, Express, Mongoose (MongoDB) |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Face Verification | Python, OpenCV, DeepFace (Facenet embeddings), invoked from Node via `python-shell` |
| Testing | Vitest, Testing Library |

## Project Structure

```
secure-vote-chain/
├── src/                     # Active frontend (Vite + React + TypeScript)
│   ├── pages/                # Landing, Register, Authenticate, Vote, Admin, Results
│   ├── components/            # Shared UI and layout components
│   └── lib/                   # API client, smart contract bindings, constants
├── server/                  # Express backend
│   ├── Controller/            # Auth and vote controllers
│   ├── Models/                 # Mongoose schemas: User, Candidate, Election
│   ├── Routes/                  # /api/auth and /api/vote routes
│   └── face_service/            # Python DeepFace scripts for encode/verify
├── smart_contract/          # Truffle project
│   ├── contracts/             # Voting.sol, Transaction.sol
│   └── migrations/             # Deployment scripts
├── client/                  # Legacy CRA-based frontend (reference only)
└── dist/                    # Production build output
```

## Prerequisites

Make sure the following are installed before setting up the project:

- **Node.js** v18+ and npm
- **MongoDB** (local instance or a hosted URI, e.g. MongoDB Atlas)
- **Python** 3.10–3.11 with `pip` (for the face-recognition service; DeepFace/OpenCV compatibility is best on these versions)
- **Truffle** (`npm install -g truffle`) and **Ganache** (GUI or CLI) for a local Ethereum blockchain
- **MetaMask** browser extension, configured to connect to your local Ganache network

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Darshanathrava/secure-vote-chain.git
   cd secure-vote-chain
   ```

2. **Install frontend dependencies** (root project)

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Install Python dependencies for face verification**

   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate      # On Windows: venv\Scripts\activate
   pip install deepface opencv-python numpy
   cd ..
   ```

5. **Install smart contract dependencies and compile**

   ```bash
   cd smart_contract
   npm install
   truffle compile
   cd ..
   ```

## Configuration

Create a `.env` file inside `server/` with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
PORT=1322

EMAIL=your_notification_email@example.com
EMAILPASSWORD=your_email_app_password
```

On the frontend, the deployed contract address is read from `src/lib/constants.ts` (`CONTRACT_ADDRESS`) — update this after each contract deployment. The API base URL is set in `src/lib/api.ts` and defaults to `http://localhost:1322/api`.

**Never commit your `.env` file or private keys.** Ensure `server/.env` stays listed in `.gitignore`.

## Running the Project

1. **Start Ganache** and note the RPC URL (defaults to `http://127.0.0.1:7545`).

2. **Deploy the smart contract:**

   ```bash
   cd smart_contract
   truffle migrate --network development
   cd ..
   ```

   Copy the deployed contract address into `src/lib/constants.ts`.

3. **Configure MetaMask** to connect to the Ganache network (Network Name: `Localhost 7545`, RPC URL: `http://127.0.0.1:7545`, Chain ID: `1337`) and import a Ganache account.

4. **Run backend and frontend together:**

   ```bash
   npm run dev
   ```

   This uses `concurrently` to start the Express server (`npm run backend`) and the Vite dev server (`npm run frontend`) in parallel.

   Alternatively, run them separately:

   ```bash
   npm run backend     # Starts the Express API on the configured PORT
   npm run frontend    # Starts the Vite dev server (default: http://localhost:5173)
   ```

5. Visit the frontend URL printed by Vite in your browser.

## Usage Guidelines

1. **Register** a voter account on the Register page, capturing a reference face image that is encoded and stored against the voter's profile.
2. **Authenticate** before voting: the app captures a live face image and verifies it against the stored encoding (cosine similarity threshold of 0.7) via the `face_service` scripts.
3. **Connect a wallet** through MetaMask on the Vote page.
4. **Cast a vote** for a candidate — this submits a transaction to the `Voting` smart contract and updates the voter's status once confirmed.
5. **View results** on the Results page, which reads live vote counts directly from the blockchain.
6. **Admins** can add candidates and close voting via the Admin page, which calls the contract's `addCandidate` and `closeVoting` functions (restricted to the deploying account).

## Contributing Guidelines

Contributions are welcome. To propose a change:

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes, following the existing code style (TypeScript/ESLint conventions on the frontend, standard Express patterns on the backend).
3. Add or update tests where relevant (`npm run test` runs Vitest for the frontend).
4. Run `npm run typecheck` to confirm there are no TypeScript errors.
5. Commit using clear, descriptive messages (e.g. `feat: add candidate deletion endpoint`, `fix: correct face similarity threshold`).
6. Push your branch and open a Pull Request describing the change, its motivation, and any testing performed.
7. Be responsive to review feedback — small, focused PRs are easier to review and merge.

Please avoid committing secrets, `.env` files, private keys, or biometric/face image data as part of any contribution.

## License

This project does not yet include a `LICENSE` file. Until one is added, all rights are reserved by the repository owner by default, and the code should not be reused, modified, or redistributed without explicit permission.

If you intend to open-source this project, adding a permissive license such as [MIT](https://choosealicense.com/licenses/mit/) is a common choice for academic and portfolio projects — it allows reuse with attribution and minimal restriction. You can add one by creating a `LICENSE` file at the project root using [choosealicense.com](https://choosealicense.com/) as a reference.

## Contact

**Maintainer:** Darshan Athrava
**Repository:** [github.com/Darshanathrava/secure-vote-chain](https://github.com/Darshanathrava/secure-vote-chain)

For questions, bug reports, or feature requests, please [open an issue](https://github.com/Darshanathrava/secure-vote-chain/issues) on the repository.

---

## A Note on README Best Practices

A few conventions worth keeping in mind as this document evolves:

- **Lead with a one-line description** of what the project does and who it's for, before diving into details.
- **Keep installation steps copy-pasteable** — exact commands, in the order they should be run, with no ambiguity about the working directory.
- **Document environment variables explicitly**, including which are required vs. optional, without ever committing real secret values.
- **Add a LICENSE file** as soon as possible; GitHub will surface it automatically once present, and it clarifies how others may use your code.
- **Include screenshots or a short demo GIF** once the UI stabilizes — voting flows are easier to understand visually than in prose.
- **Keep a CHANGELOG** (even a simple one) if the project moves past prototype stage, so contributors can track what changed between versions.
- **Badges** (build status, license, last commit) are optional but common in professional repos — consider adding them via [shields.io](https://shields.io/) once CI is set up.

Standard references for structuring future updates to this README: [Make a README](https://www.makeareadme.com/) and GitHub's own [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) guide.
