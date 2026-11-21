# 🛡️ W3RS: Web3 Research & Security Playground

> **Web3 Vulnerability aka SWC (Smart Contract Weakness Classification) practice ground for Smart Contract Auditing on Solana and Ethereum ecosystem. An offline localhost and local blockchain node complete offline practice ground.**

> 🚧 **Status: In Active Development (WIP / Research Phase)**  
> *This playground is currently under active research and development. Not a formal release.*

<p align="center">
  <img src="POSTER2.png" alt="W3RS Security Playground" width="100%" style="border-radius: 8px;" />
</p>

---

## ⚡ Overview & Vision

**W3RS** is an offline, gamified smart contract weakness classification (SWC) and security research ground. Built for smart contract auditors, security researchers, and Web3 developers, it provides a **dual-chain architecture** hosting both an **EVM testnet (Foundry Anvil)** and a **Solana SVM testnet (`solana-test-validator`)** side-by-side entirely on your local machine.

### Key Highlights
- 🧪 **100% Offline & Free**: Run complete local blockchain nodes without external RPCs, faucets, testnet tokens, or API keys.
- ⛓️ **Dual-Ecosystem Coverage**:
  - **Ethereum (EVM / Solidity)**: SWC-107 (Reentrancy), Flash Loans, Oracle Manipulation, Storage Collisions, Access Control.
  - **Solana (SVM / Anchor / Rust)**: Missing Signers, Account Confusion, Arbitrary CPI, PDA Bumps, Remaining Accounts manipulation.
  - **Cross-Chain (Bridges)**: Relayer message spoofing, fake signatures, VAA replay attacks.
- 🔁 **Carefree State Rollbacks**: Instant `evm_snapshot` rollbacks and ledger resets in milliseconds without restarting nodes.
- 🎯 **Gamified Verification**: Inspect vulnerable targets, execute custom exploit scripts, and automatically verify win conditions to capture flags.

---

## 🛠️ Sandbox Quick Start (Development Mode)

### Step 1: Start the Dual-Chain Sandbox
From the repository root:
```bash
./run.sh start
```
This automatically boots:
- **EVM Node (Anvil)** $\rightarrow$ `http://127.0.0.1:8545`
- **Solana Node (SVM)** $\rightarrow$ `http://127.0.0.1:8899`

Check status anytime:
```bash
./run.sh status
```

### Step 2: Run the Development Core CLI
```bash
cd core

# Check connected node health
cargo run -- status

# List all security missions
cargo run -- list

# Inspect a specific mission briefing & source code
cargo run -- info 01

# Deploy mission instance
cargo run -- start 01

# Verify your exploit and claim flag
cargo run -- check 01
```

---

## 🎯 Active Development Missions

| ID | Title | Target Network | Difficulty | Vulnerability Class |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **The Reentrant Vault** | EVM (Ethereum) | Easy | SWC-107 (Reentrancy) |
| **02** | **The Unchecked Signer** | SVM (Solana) | Medium | Missing Signer / Ownership validation in Anchor |
| **03** | **The Phantom Bridge** | EVM + Solana | Hard | Cross-chain relayer signature forgery & replay |

---

## ⚙️ Development Commands

| Command | Action |
| :--- | :--- |
| `./run.sh start` | Boot up Anvil & Solana nodes in the background |
| `./run.sh status` | Display real-time RPC block numbers and health |
| `./run.sh reset` | Wipe ledgers and restore clean sandbox state |
| `./run.sh stop` | Gracefully shut down all background blockchain nodes |
| `./run.sh logs` | Follow live output of node transactions |

---

## 🏷️ Tags & Ecosystem Focus

`solidity` • `anchor` • `rust` • `dapp` • `web3-security` • `smart-contract-audit` • `smart-contract-security` • `foundry` • `svm` • `evm`

---

## 📜 License

MIT License (see [`LICENSE`](LICENSE)) — Copyright (c) 2026 SAMIR897
