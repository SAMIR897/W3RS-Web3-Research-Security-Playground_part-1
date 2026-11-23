<p align="center">
  <img src="POSTER2.png" alt="W3RS — Web3 Research & Security Playground" width="100%" />
</p>

<h1 align="center">W3RS — Web3 Research & Security Playground</h1>

<p align="center">
  <strong>An offline, gamified, dual-chain smart contract exploitation lab.</strong><br/>
  Practice real SWC vulnerabilities. Break real contracts. No testnet tokens, no API keys, no internet required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.1--dev-blueviolet?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/status-In%20Active%20Development-orange?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/chains-EVM%20%2B%20SVM-blue?style=flat-square" alt="Chains" />
  <img src="https://img.shields.io/badge/offline-100%25-brightgreen?style=flat-square" alt="Offline" />
</p>

---

> [!WARNING]
> **This project is in active research & development (v0.0.1-dev).** Interfaces, mission contracts, and the game engine are subject to breaking changes. This is not a production release.

---

## Table of Contents

- [What Is W3RS](#what-is-w3rs)
- [Architecture Overview](#architecture-overview)
- [System Requirements](#system-requirements)
- [Prerequisites & Toolchain Matrix](#prerequisites--toolchain-matrix)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Mission Catalog](#mission-catalog)
- [Sandbox Manager Reference](#sandbox-manager-reference)
- [CLI Reference](#cli-reference)
- [Game Engine](#game-engine)
- [Development Roadmap](#development-roadmap)
- [Security & Legal Disclaimer](#security--legal-disclaimer)
- [Contributing](#contributing)
- [License](#license)

---

## What Is W3RS

**W3RS** (Web3 Research & Security) is a **fully offline** smart contract security training ground that lets you study, exploit, and verify real vulnerability patterns across the two dominant blockchain ecosystems:

| Ecosystem | Runtime | Local Node | Language |
|:---|:---|:---|:---|
| **Ethereum** | EVM (Ethereum Virtual Machine) | Foundry Anvil | Solidity |
| **Solana** | SVM (Solana Virtual Machine) | solana-test-validator | Rust / Anchor |

Instead of reading about vulnerabilities in documentation, you **deploy intentionally broken contracts to local blockchain nodes**, write your own exploit code in a real terminal, and verify success through automated flag capture — all while watching a pixel-art battle scene react to your on-chain actions in real time.

### Core Design Principles

- **Zero External Dependencies at Runtime** — No internet, no faucets, no MetaMask, no API keys. Every chain runs on `127.0.0.1`.
- **Dual-Chain Coverage** — EVM and SVM missions run side-by-side. Cross-chain bridge attacks span both simultaneously.
- **Gamified Verification** — Every mission has a programmatic win condition. The CLI and game engine verify your exploit automatically and award flags.
- **Instant State Rollback** — Wipe ledgers and restart clean in milliseconds with `./run.sh reset`. No redeployment delays.
- **Modular Mission Architecture** — Each mission is self-contained: its own contract source, deploy script, briefing, and verification logic.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        W3RS Architecture                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────────────┐           ┌───────────────────┐             │
│   │   Foundry Anvil   │           │  solana-test-     │             │
│   │   (EVM Node)      │           │  validator (SVM)  │             │
│   │   Port: 8545      │           │  Port: 8899       │             │
│   └────────┬──────────┘           └────────┬──────────┘             │
│            │       JSON-RPC                │                        │
│            └───────────┬───────────────────┘                        │
│                        │                                            │
│            ┌───────────▼───────────┐                                │
│            │   run.sh              │                                │
│            │   Sandbox Manager     │                                │
│            │   (start/stop/reset)  │                                │
│            └───────────┬───────────┘                                │
│                        │                                            │
│        ┌───────────────┼───────────────┐                            │
│        │                               │                            │
│  ┌─────▼─────┐                 ┌───────▼────────┐                   │
│  │  core/    │                 │    game/       │                   │
│  │  Rust CLI │                 │  Browser Engine│                   │
│  │  (w3rs)   │                 │  (Canvas/WebGL)│                   │
│  │           │                 │                │                   │
│  │  • status │  chain-bridge   │  • Boss battles│                   │
│  │  • list   │◄───────────────►│  • HP = balance│                   │
│  │  • start  │   (JSON-RPC)    │  • Live events │                   │
│  │  • check  │                 │  • Pixel-art   │                   │
│  └───────────┘                 └────────────────┘                   │
│                                                                     │
│   ┌───────────────────────────────────────────────────────┐         │
│   │                     missions/                         │         │
│   │   01_evm_reentrancy/      EtherVault.sol              │         │
│   │   02_solana_signer_bypass/ lib.rs (Anchor)            │         │
│   │   03_cross_chain_bridge/  Bridge.sol + BridgeMinter   │         │
│   └───────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

**Data flow:** You write exploit code → deploy to local chain via Foundry (`forge`) or Anchor → the CLI polls RPC endpoints → the game engine's `chain-bridge.js` translates contract state into boss HP, damage events, and victory conditions on the Canvas.

---

## System Requirements

| Resource | Minimum | Recommended |
|:---|:---|:---|
| **OS** | macOS 12+ / Ubuntu 20.04+ / WSL2 | macOS 14+ / Ubuntu 22.04+ |
| **CPU** | Dual-core x86_64 or Apple Silicon | Quad-core |
| **RAM** | 4 GB | 8 GB |
| **Disk** | 2 GB free (toolchain + ledger data) | 5 GB free |
| **GPU** | Not required (Canvas 2D) | Any (for WebGL 3D missions) |
| **Browser** | Any modern browser (game engine) | Chromium-based (DevTools + RPC debugging) |
| **Network** | **Not required** — 100% offline | — |

> [!NOTE]
> Both Anvil and solana-test-validator are lightweight processes. Combined baseline footprint is approximately **80–150 MB RAM** and **< 2% CPU** when idle.

---

## Prerequisites & Toolchain Matrix

Before cloning the repository, ensure your environment meets the toolchain specifications below. W3RS is designed to be **100% native** — all node processes and compilers execute directly on your host machine without container overhead (no Docker required).

### Toolchain Specification Matrix

| Ecosystem / Layer | Component | Minimum Version | Recommended | Verification Command | Purpose in W3RS |
|:---|:---|:---|:---|:---|:---|
| **Core CLI Engine** | **Rust & Cargo** | `1.75.0` (edition 2021) | `1.80.0+` | `rustc --version` | Compiles the `w3rs` orchestrator CLI and Anchor programs |
| **EVM Ecosystem** | **Foundry (`anvil`)** | `nightly` (2024+) | Latest stable | `anvil --version` | Local Ethereum node running on `127.0.0.1:8545` |
| **EVM Ecosystem** | **Foundry (`forge`)** | `nightly` (2024+) | Latest stable | `forge --version` | Compiles, tests, and deploys Solidity exploit contracts |
| **EVM Ecosystem** | **Foundry (`cast`)** | `nightly` (2024+) | Latest stable | `cast --version` | Sends raw RPC transactions, queries balances, triggers exploits |
| **SVM Ecosystem** | **Solana Tool Suite** | `v1.18.0` | `v1.18.x` / `v2.0+` | `solana --version` | Manages local keypairs, airdrops, and program accounts |
| **SVM Ecosystem** | **`solana-test-validator`** | `v1.18.0` | `v1.18.x` / `v2.0+` | `solana-test-validator -V` | Local SVM validator running on `127.0.0.1:8899` |
| **SVM Framework** | **Anchor (`anchor-cli`)** | `v0.30.0` | `v0.30.1+` | `anchor --version` | Builds and deploys Anchor-based Solana challenge programs |
| **Game Visualizer** | **Node.js or Python 3** | Node `18+` / Python `3.8+` | Node `20+ LTS` | `node -v` / `python3 -V` | *(Optional)* Runs local static HTTP server for browser arcade UI |

---

### Parallel Ecosystem Breakdown

Below is a parallel summary of the toolchains grouped by playground subsystem:

- 🔷 **Ethereum (EVM) Toolchain**
  - **Local Node:** Foundry `anvil` (Port: `8545`, Chain ID: `31337`)
  - **Contract Language:** Solidity (`^0.8.20`)
  - **Build & Deploy:** Foundry `forge`
  - **CLI Interaction:** Foundry `cast`
  - **Required Version:** Foundry nightly / 2024+

- 🟣 **Solana (SVM) Toolchain**
  - **Local Node:** `solana-test-validator` (RPC Port: `8899`, WebSocket: `8900`)
  - **Contract Language:** Rust (`2021` edition) with Anchor framework
  - **Build & Deploy:** Anchor (`anchor build` / `anchor deploy`)
  - **Account & Keypair Management:** Solana CLI (`solana-keygen`, `solana`)
  - **Required Version:** Solana CLI `1.18+` / Anchor `0.30+`

- 🦀 **Core Orchestrator Toolchain**
  - **Language & Runtime:** Rust `1.75.0+` / Cargo
  - **Core Libraries:** Tokio async runtime (`1.38`), Reqwest JSON-RPC (`0.12`), Clap CLI (`4.5`)
  - **Sandbox Supervisor:** Bash (`run.sh`) using native background daemons (`nohup`, `lsof`, `pkill`)
  - **Connectivity:** 100% Offline via loopback IP (`127.0.0.1`)

- 🎮 **Game Engine & Visualizer (Optional)**
  - **Runtime:** Any modern browser supporting HTML5 Canvas (Chrome, Safari, Firefox, Arc, Brave)
  - **Graphics Engine:** Custom 60 FPS Canvas 2D engine (`game/engine.js`) + Three.js for retro 3D
  - **Local Dev Server:** `npx serve .` or `python3 -m http.server` *(or simply double-click `game/index.html`)*

---

### Step-by-Step Installation Guide

Install the following toolchains **before** cloning the repository. All tools are free and open-source.

#### 1. Rust & Cargo

The CLI orchestrator (`core/`) is written in Rust.

```bash
# Install via rustup (official installer)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version    # Expected: 1.75.0 or later
cargo --version
```

> Minimum supported Rust version: **1.75.0** (edition 2021).

#### 2. Foundry (Anvil, Forge, Cast)

Foundry provides the local EVM node and Solidity development tools.

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify all three binaries
anvil --version     # Local EVM blockchain node
forge --version     # Solidity compiler & deployer
cast --version      # CLI for contract interaction
```

| Binary | Purpose in W3RS |
|:---|:---|
| `anvil` | Runs the local Ethereum node on port 8545 |
| `forge` | Compiles and deploys Solidity mission contracts |
| `cast` | Sends transactions and reads contract state from terminal |

#### 3. Solana CLI & Test Validator

Required for SVM (Solana) missions.

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Add to PATH (add this to your shell profile)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify
solana --version                  # CLI tools
solana-test-validator --version   # Local Solana node
```

#### 4. Anchor Framework

Required for building and deploying Solana/Anchor program missions.

```bash
# Install via Anchor Version Manager (avm)
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest

# Verify
anchor --version    # Expected: 0.30.0 or later
```

#### 5. Optional: Node.js

Not required for core functionality. Only needed if you want to run a local dev server for the game engine with hot-reload.

```bash
node --version    # 18+ recommended
npx --version
```

> [!TIP]
> **No Docker required.** W3RS runs entirely on native binaries. If you already have Foundry and Solana installed, you likely have everything you need.

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/SAMIR897/W3RS-Web3-Research-Security-Playground_part-1.git
cd W3RS-Web3-Research-Security-Playground_part-1

# 2. Build the Rust CLI orchestrator
cd core
cargo build --release
cd ..

# 3. Make the sandbox manager executable
chmod +x run.sh

# 4. Verify everything is wired up
./run.sh status          # Should show both nodes as OFFLINE (not started yet)
cd core && cargo run -- list    # Should print the mission catalog
```

**Expected output from `cargo run -- list`:**

```
=============================================
        w3rs: Security Lab Missions
=============================================

[01] The Reentrant Vault
     Chain: EVM (Ethereum) | Difficulty: Easy
     Vuln:  Reentrancy (State updates after external call)

[02] The Unchecked Signer
     Chain: SVM (Solana)   | Difficulty: Medium
     Vuln:  Missing Signer & Ownership Verification

[03] The Phantom Bridge
     Chain: Cross-Chain (EVM + Solana) | Difficulty: Hard
     Vuln:  Cross-Chain Signature Forgery & Relayer Replay
```

---

## Quick Start

### 1 — Boot the Dual-Chain Sandbox

```bash
./run.sh start
```

This starts two local blockchain nodes in the background:

| Node | Endpoint | Pre-Funded Accounts |
|:---|:---|:---|
| **Anvil (EVM)** | `http://127.0.0.1:8545` | 10 accounts × 10,000 ETH each |
| **Solana (SVM)** | `http://127.0.0.1:8899` | Default validator keypair with SOL |

### 2 — Pick a Mission

```bash
cd core

# Browse available missions
cargo run -- list

# Read the full briefing for Mission 01
cargo run -- info 01
```

### 3 — Deploy the Vulnerable Target

```bash
cargo run -- start 01
```

This deploys the intentionally vulnerable contract to your local chain and prints the target address.

### 4 — Write Your Exploit

Open your preferred editor or terminal. Using Foundry's `cast` and `forge` for EVM missions:

```bash
# Example: Deploy your attacker contract against the EtherVault
forge create AttackVault \
  --constructor-args <VAULT_ADDRESS> \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <ATTACKER_PRIVATE_KEY>

# Trigger the exploit
cast send <YOUR_ATTACK_CONTRACT> "attack()" \
  --value 1ether \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <ATTACKER_PRIVATE_KEY>
```

### 5 — Verify & Capture the Flag

```bash
cargo run -- check 01
```

If the vault is drained to 0 ETH:

```
******************************************************************
                    MISSION ACCOMPLISHED!
******************************************************************
  Mission [01]: The Reentrant Vault
  FLAG CAPTURED : FLAG{w3rs_r33ntr4ncy_d0n3_r1ght}
  Score Awarded : +100 PTS
******************************************************************
```

### 6 — Open the Game Engine (Optional)

Open `game/index.html` in any browser to see the pixel-art boss battle visualizer. The game engine polls your local chain via `chain-bridge.js` and translates contract state into real-time combat animations.

### 7 — Reset and Repeat

```bash
./run.sh reset    # Wipes all ledger data and restarts clean nodes
```

---

## Project Structure

```
W3RS/
├── README.md                           # This file
├── LICENSE                             # MIT License
├── POSTER2.png                         # Project artwork
├── POSTER3.png                         # Project artwork (alternate)
├── .gitignore                          # Build artifacts, ledger data, OS files
├── run.sh                              # Dual-chain sandbox manager (Bash)
│
├── core/                               # Rust CLI orchestrator
│   ├── Cargo.toml                      # Dependencies: clap, tokio, reqwest, serde, colored
│   └── src/
│       └── main.rs                     # CLI entry point (status, list, info, start, check, reset)
│
├── game/                               # Browser-based game engine
│   ├── index.html                      # Arcade cabinet layout with HUD and terminal log
│   ├── style.css                       # Retro sage-green arcade theme
│   ├── engine.js                       # 60 FPS Canvas renderer, entity system, particle FX
│   └── chain-bridge.js                 # JSON-RPC poller with auto-reconnect for Anvil & Solana
│
├── missions/                           # Self-contained vulnerability challenges
│   ├── 01_evm_reentrancy/
│   │   └── EtherVault.sol              # SWC-107: Classic reentrancy + exploit template
│   ├── 02_solana_signer_bypass/
│   │   └── src/lib.rs                  # Anchor: Missing Signer<'info> authorization flaw
│   └── 03_cross_chain_bridge/          # Cross-chain relayer forgery (WIP)
│
├── config/                             # Mission and engine configuration (WIP)
└── scripts/                            # Deployment and automation scripts (WIP)
```

---

## Mission Catalog

### Mission 01 — The Reentrant Vault

| Field | Detail |
|:---|:---|
| **Network** | EVM (Ethereum / Anvil) |
| **Contract** | `EtherVault.sol` — Accepts deposits, allows withdrawals |
| **Vulnerability** | [SWC-107](https://swcregistry.io/docs/SWC-107/): State update occurs **after** external call |
| **Objective** | Drain all 10 ETH from the vault to your attacker address |
| **Difficulty** | ★☆☆ Easy |
| **Skills Tested** | Fallback functions, `call{value}`, CEI pattern violation |

**Attack Vector:** The `withdraw()` function sends ETH via `msg.sender.call{value: bal}("")` before setting `balances[msg.sender] = 0`. Deploy a contract with a `receive()` fallback that re-enters `withdraw()` recursively.

---

### Mission 02 — The Unchecked Signer

| Field | Detail |
|:---|:---|
| **Network** | SVM (Solana / test-validator) |
| **Contract** | Anchor program with `AccountInfo` instead of `Signer<'info>` |
| **Vulnerability** | Missing cryptographic signature verification on authority account |
| **Objective** | Impersonate the vault authority and withdraw 100 SOL without their private key |
| **Difficulty** | ★★☆ Medium |
| **Skills Tested** | Solana account model, `is_signer` checks, Anchor `Signer` type |

**Attack Vector:** The `WithdrawFunds` instruction accepts `authority: AccountInfo<'info>` without validating `is_signer`. Pass the legitimate authority's public key as a non-signing account and drain the treasury.

---

### Mission 03 — The Phantom Bridge

| Field | Detail |
|:---|:---|
| **Network** | Cross-Chain (EVM + Solana) |
| **Contract** | EVM lockbox + Solana minter program |
| **Vulnerability** | Bridge relayer accepts zero-value signatures and replayed VAAs |
| **Objective** | Mint 1,000,000 wrapped tokens on Solana without locking any real tokens on EVM |
| **Difficulty** | ★★★ Hard |
| **Skills Tested** | Cross-chain message passing, signature validation, replay protection |

> [!NOTE]
> Mission 03 contracts are under active development. The briefing and attack surface may change.

---

## Sandbox Manager Reference

The `run.sh` script manages both local blockchain nodes from a single interface.

| Command | Action |
|:---|:---|
| `./run.sh start` | Start Anvil (EVM, port 8545) and solana-test-validator (SVM, port 8899) |
| `./run.sh stop` | Gracefully terminate both nodes |
| `./run.sh status` | Display real-time RPC connectivity, block height, and slot number |
| `./run.sh reset` | Stop nodes → wipe all ledger data and logs → restart clean |
| `./run.sh logs` | Tail live transaction logs from both nodes |

**What `start` provisions:**

- **EVM (Anvil):** 10 deterministic accounts with 10,000 ETH each. 1-second block time. Full EVM opcode support including `CREATE2`, `SELFDESTRUCT`, and all precompiles.
- **Solana (SVM):** Fresh ledger with the default validator keypair funded. Full BPF program deployment support. Automatic `--reset` on each start for clean state.

**Where runtime data lives (all gitignored):**

| Path | Contents |
|:---|:---|
| `logs/anvil.log` | Anvil stdout/stderr |
| `logs/solana.log` | Solana validator stdout/stderr |
| `.pids/anvil.pid` | Anvil process ID for lifecycle management |
| `.pids/solana.pid` | Solana validator process ID |
| `.solana_ledger/` | Solana validator ledger (auto-cleaned on reset) |

---

## CLI Reference

The `w3rs` CLI is the command-line orchestrator built in Rust. Run from the `core/` directory.

```
USAGE: cargo run -- <COMMAND>

COMMANDS:
  status    Check health and connectivity of local EVM and Solana nodes
  list      List all security lab missions and completion status
  info <ID> Show mission briefing, source code path, and exploit objectives
  start <ID> Deploy and start a mission instance on local chain(s)
  check <ID> Verify if the mission objective has been achieved
  reset     Reset nodes and mission state (delegates to run.sh)

OPTIONS:
  -h, --help     Print help
  -V, --version  Print version (0.0.1-dev)
```

**Dependencies:**

| Crate | Version | Purpose |
|:---|:---|:---|
| `clap` | 4.5 | CLI argument parsing with derive macros |
| `tokio` | 1.38 | Async runtime for RPC calls |
| `reqwest` | 0.12 | HTTP client for JSON-RPC communication |
| `serde` / `serde_json` | 1.0 | Serialization for RPC payloads |
| `colored` | 2.1 | Terminal color output |
| `anyhow` | 1.0 | Error handling |

---

## Game Engine

The browser-based game engine provides a visual layer on top of the blockchain sandbox. It is **not required** for completing missions — it's a real-time visualizer that makes exploitation tangible.

### How It Works

1. **`chain-bridge.js`** polls the local blockchain nodes via JSON-RPC at regular intervals.
2. Contract state changes (balance drops, program account mutations) are translated into game events.
3. **`engine.js`** renders a 60 FPS pixel-art battle scene on HTML5 Canvas where:
   - **Boss HP** = vulnerable contract's remaining balance
   - **Player attacks** = your exploit transactions hitting the chain
   - **Victory** = contract drained to zero (flag captured)

### Running the Game Engine

```bash
# Option A: Direct file open (no server needed)
open game/index.html          # macOS
xdg-open game/index.html     # Linux

# Option B: Local dev server (if you have Node.js / Python)
cd game && npx serve .        # Node.js
cd game && python3 -m http.server 3000   # Python
```

The engine gracefully handles offline mode — if blockchain nodes aren't running, it enters standby and reconnects automatically when you start them.

### Planned Engine Features (WIP)

- Pixel-art sprite sheet system (Ninja and Commando factions)
- Retro 3D mode via Three.js for select missions (PS1-era aesthetic, 320×240 internal resolution)
- 8-bit procedural audio via Web Audio API
- Typewriter dialogue system with character portraits
- Collapsible hacker HUD with live contract state, test keys, and event logs

---

## Development Roadmap

> Current version: **0.0.1-dev** — Infrastructure & engine foundation.

| Phase | Status | Description |
|:---|:---|:---|
| **Phase 0: Foundation** | ✅ Complete | Dual-chain sandbox, CLI orchestrator, mission contracts, game engine prototype |
| **Phase 1: Visual Identity** | 🔧 In Progress | Pixel-art sprite sheets, Ninja/Commando character system, parallax backgrounds |
| **Phase 2: Mission Runtime** | 📋 Planned | Forge/Anchor deploy scripts, automated contract deployment, live win-condition verification |
| **Phase 3: Story & Narrative** | 📋 Planned | Mission briefing cutscenes, typewriter dialogue, faction selection, campaign progression |
| **Phase 4: 3D Missions** | 📋 Planned | Three.js retro 3D renderer for cross-chain bridge missions (PS1-era pixel aesthetic) |
| **Phase 5: Audio & Polish** | 📋 Planned | Web Audio API procedural SFX, screen transitions, score tracking, achievement system |
| **Phase 6: Extended Catalog** | 📋 Planned | Flash loan attacks, oracle manipulation, storage collisions, integer overflows, MEV extraction |

---

## Security & Legal Disclaimer

> [!CAUTION]
> **W3RS is an educational security research tool.** All vulnerable contracts are intentionally broken for learning purposes.

- All exploitation occurs exclusively on **local blockchain nodes** (`127.0.0.1`). No mainnet, testnet, or external network is ever contacted.
- The contracts, exploits, and attack patterns documented here are based on **publicly known vulnerability classifications** ([SWC Registry](https://swcregistry.io/), Solana security advisories, and published bridge post-mortems).
- **Do not deploy these contracts or techniques against any production system.** Unauthorized access to computer systems is illegal under the CFAA (US), Computer Misuse Act (UK), IT Act (India), and equivalent legislation worldwide.
- This project is intended for **security researchers, smart contract auditors, and Web3 developers** building defensive skills in a safe, isolated environment.

---

## Contributing

W3RS is in early development. Contributions are welcome once the core mission runtime stabilizes.

**Areas where contributions will be valuable:**

- New vulnerability missions (EVM, SVM, or cross-chain)
- Pixel-art sprite assets (characters, backgrounds, bosses)
- Forge/Anchor deployment scripts and test harnesses
- Documentation improvements and educational write-ups
- Accessibility and internationalization

If you're interested in contributing, open an issue to discuss your idea before submitting a PR.

---

## License

MIT License — Copyright (c) 2026 SAMIR897

See [`LICENSE`](LICENSE) for the full text.

---

<p align="center">
  <strong>W3RS</strong> — Break contracts. Capture flags. Learn security.
</p>
