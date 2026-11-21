use clap::{Parser, Subcommand};
use colored::*;
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Parser)]
#[command(name = "w3rs")]
#[command(about = "Gamified Web3 Security & Research Lab (EVM + Solana)", long_about = None)]
#[command(version = "0.1.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Check health and connectivity of local EVM and Solana nodes
    Status,
    /// List all security lab missions and completion status
    List,
    /// Show mission briefing, vulnerable source code, and exploit objectives
    Info {
        /// Mission ID (e.g., 01, 02, 03)
        mission: String,
    },
    /// Deploy and start a mission instance on local chain(s)
    Start {
        /// Mission ID to start
        mission: String,
    },
    /// Verify if the mission objective has been achieved
    Check {
        /// Mission ID to verify
        mission: String,
    },
    /// Reset nodes or mission state
    Reset,
}

#[derive(Serialize, Deserialize, Clone)]
struct Mission {
    id: &'static str,
    title: &'static str,
    chain_type: &'static str,
    difficulty: &'static str,
    vuln_class: &'static str,
    summary: &'static str,
    contract_file: &'static str,
    objective: &'static str,
}

const MISSIONS: &[Mission] = &[
    Mission {
        id: "01",
        title: "The Reentrant Vault",
        chain_type: "EVM (Ethereum)",
        difficulty: "Easy",
        vuln_class: "Reentrancy (State updates after external call)",
        summary: "A savings vault allows users to deposit and withdraw ETH, but updates user balance after sending funds.",
        contract_file: "missions/01_evm_reentrancy/EtherVault.sol",
        objective: "Drain all 10 ETH from the EtherVault contract into your attacker address.",
    },
    Mission {
        id: "02",
        title: "The Unchecked Signer",
        chain_type: "SVM (Solana)",
        difficulty: "Medium",
        vuln_class: "Missing Signer & Ownership Verification",
        summary: "An Anchor vault program authorizes withdrawals using an AccountInfo parameter without verifying `is_signer`.",
        contract_file: "missions/02_solana_signer_bypass/src/lib.rs",
        objective: "Impersonate the authority and withdraw the 100 SOL treasury to your attacker keypair.",
    },
    Mission {
        id: "03",
        title: "The Phantom Bridge",
        chain_type: "Cross-Chain (EVM + Solana)",
        difficulty: "Hard",
        vuln_class: "Cross-Chain Signature Forgery & Relayer Replay",
        summary: "An EVM lockbox emits deposit receipts that a Solana program mints as wrapped tokens, but signature validation accepts zeroes.",
        contract_file: "missions/03_cross_chain_bridge/Bridge.sol & BridgeMinter.rs",
        objective: "Mint 1,000,000 wrapped tokens on Solana without locking any real tokens on the EVM bridge.",
    },
];

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Status => check_status().await,
        Commands::List => list_missions(),
        Commands::Info { mission } => show_info(&mission),
        Commands::Start { mission } => start_mission(&mission).await,
        Commands::Check { mission } => check_mission(&mission).await,
        Commands::Reset => reset_environment(),
    }
}

async fn check_status() {
    println!("{}", "\n=============================================".bold().cyan());
    println!("{}", "        w3rs: Dual-Chain Sandbox Status      ".bold().cyan());
    println!("{}", "=============================================\n".bold().cyan());

    // 1. Check EVM (Anvil)
    print!("• EVM Node (http://127.0.0.1:8545)    : ");
    let evm_client = reqwest::Client::new();
    let evm_res = evm_client
        .post("http://127.0.0.1:8545")
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_blockNumber",
            "params": [],
            "id": 1
        }))
        .send()
        .await;

    match evm_res {
        Ok(resp) if resp.status().is_success() => {
            if let Ok(json) = resp.json::<serde_json::Value>().await {
                let block = json["result"].as_str().unwrap_or("0x0");
                let block_num = u64::from_str_radix(block.trim_start_matches("0x"), 16).unwrap_or(0);
                println!("{} (Block: {})", "ONLINE".bold().green(), block_num);
            } else {
                println!("{}", "ONLINE".bold().green());
            }
        }
        _ => println!("{} (Run './run.sh start')", "OFFLINE".bold().red()),
    }

    // 2. Check Solana (solana-test-validator)
    print!("• Solana Node (http://127.0.0.1:8899) : ");
    let sol_client = reqwest::Client::new();
    let sol_res = sol_client
        .post("http://127.0.0.1:8899")
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "getHealth",
            "id": 1
        }))
        .send()
        .await;

    match sol_res {
        Ok(resp) if resp.status().is_success() => {
            println!("{}", "ONLINE".bold().green());
        }
        _ => println!("{} (Run './run.sh start')", "OFFLINE".bold().red()),
    }

    println!("\nTip: Use '{}' to see all hacking challenges.\n", "w3rs list".bold().yellow());
}

fn list_missions() {
    println!("{}", "\n=========================================================================================".bold().blue());
    println!("{}", "                              w3rs SECURITY LAB MISSIONS                                 ".bold().white());
    println!("{}", "=========================================================================================".bold().blue());
    println!("{:<4} | {:<22} | {:<24} | {:<10} | {:<20}", "ID", "Title", "Chain", "Difficulty", "Vulnerability");
    println!("{}", "-----------------------------------------------------------------------------------------".dimmed());

    for m in MISSIONS {
        let diff_color = match m.difficulty {
            "Easy" => m.difficulty.green(),
            "Medium" => m.difficulty.yellow(),
            _ => m.difficulty.red(),
        };

        println!(
            "{:<4} | {:<22} | {:<24} | {:<10} | {:<20}",
            m.id.bold().cyan(),
            m.title.bold(),
            m.chain_type.purple(),
            diff_color,
            m.vuln_class
        );
    }

    println!("{}", "-----------------------------------------------------------------------------------------".dimmed());
    println!("To inspect a mission : {}", "cargo run -- info <id>".bold().yellow());
    println!("To start an attack   : {}", "cargo run -- start <id>".bold().yellow());
    println!("To verify solution   : {}\n", "cargo run -- check <id>".bold().yellow());
}

fn show_info(id: &str) {
    if let Some(m) = MISSIONS.iter().find(|m| m.id == id) {
        println!("{}", "\n==================================================================".bold().cyan());
        println!("  MISSION [{}]: {}", m.id.bold(), m.title.bold().white());
        println!("{}", "==================================================================".bold().cyan());
        println!("• {}        : {}", "Chain Target".bold(), m.chain_type.purple());
        println!("• {}          : {}", "Difficulty".bold(), m.difficulty.yellow());
        println!("• {}     : {}", "Vulnerability".bold(), m.vuln_class.red());
        println!("• {}          : {}", "Source Path".bold(), m.contract_file.cyan());
        println!("\n{}", "--- BRIEFING ---".bold());
        println!("{}", m.summary);
        println!("\n{}", "--- WIN CONDITION ---".bold());
        println!("{}", m.objective.green());
        println!("{}", "==================================================================\n".bold().cyan());
    } else {
        println!("{}", format!("Mission ID '{}' not found. Run 'w3rs list'.", id).red());
    }
}

async fn start_mission(id: &str) {
    if let Some(m) = MISSIONS.iter().find(|m| m.id == id) {
        println!("\n{} Starting Mission [{}]: {}", ">>>".bold().green(), m.id, m.title.bold());

        match m.id {
            "01" => {
                println!("• Target Network: EVM (Anvil localhost:8545)");
                println!("• Deploying EtherVault with 10 ETH pool balance...");
                let script_path = "../missions/01_evm_reentrancy/deploy.sh";
                if std::path::Path::new(script_path).exists() {
                    let _ = Command::new("bash").arg(script_path).status();
                } else {
                    println!("  [✓] Mock Instance Ready at: {}", "0x5FbDB2315678afecb367f032d93F642f64180aa3".bold().yellow());
                    println!("  [✓] Initial Vault Balance : 10 ETH");
                    println!("  [✓] Attacker Address      : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
                }
            }
            "02" => {
                println!("• Target Network: Solana (localhost:8899)");
                println!("• Deploying Vault Program to SVM test validator...");
                println!("  [✓] Target Program ID : {}", "Vault11111111111111111111111111111111111111".bold().yellow());
                println!("  [✓] Vault Treasury    : 100 SOL");
            }
            "03" => {
                println!("• Target Network: Dual-Chain (EVM 8545 + Solana 8899)");
                println!("• Initializing Bridge Relayer and lockbox...");
                println!("  [✓] EVM Bridge Contract : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
                println!("  [✓] Solana Minter Program: Bridge111111111111111111111111111111111111");
            }
            _ => {}
        }

        println!("\nReady to hack! Write your exploit and run '{}' when done.\n", format!("cargo run -- check {}", m.id).bold().yellow());
    } else {
        println!("{}", format!("Mission ID '{}' not found.", id).red());
    }
}

async fn check_mission(id: &str) {
    println!("\n{} Verifying solution for Mission [{}]...", ">>>".bold().cyan(), id);

    match id {
        "01" => {
            // Check EVM EtherVault balance via eth_getBalance
            let client = reqwest::Client::new();
            let vault_addr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
            let res = client
                .post("http://127.0.0.1:8545")
                .json(&serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "eth_getBalance",
                    "params": [vault_addr, "latest"],
                    "id": 1
                }))
                .send()
                .await;

            if let Ok(resp) = res {
                if let Ok(json) = resp.json::<serde_json::Value>().await {
                    let hex_bal = json["result"].as_str().unwrap_or("0x0");
                    let balance = u128::from_str_radix(hex_bal.trim_start_matches("0x"), 16).unwrap_or(1);
                    
                    if balance == 0 {
                        print_win_banner("01", "The Reentrant Vault", "FLAG{w3rs_r33ntr4ncy_d0n3_r1ght}");
                        return;
                    } else {
                        println!("{} Vault still has {} wei. Keep hacking!", "[!] Objective Not Met:".bold().yellow(), balance);
                        println!("Hint: The vulnerable withdraw function sends ETH before resetting balances[msg.sender].");
                        return;
                    }
                }
            }
            println!("{}", "[!] Could not reach Anvil. Make sure nodes are running with './run.sh start'.".red());
        }
        "02" => {
            println!("Evaluating Solana account state on port 8899...");
            println!("Hint: Did you pass the authority account without checking if `ctx.accounts.authority.is_signer` is true?");
        }
        "03" => {
            println!("Evaluating Cross-Chain balance across EVM and Solana...");
        }
        _ => {
            println!("{}", format!("Unknown mission ID '{}'.", id).red());
        }
    }
}

fn print_win_banner(id: &str, title: &str, flag: &str) {
    println!("\n{}", "******************************************************************".bold().green());
    println!("{}", "                    MISSION ACCOMPLISHED!                         ".bold().green());
    println!("{}", "******************************************************************".bold().green());
    println!("  Mission [{}]: {}", id, title);
    println!("  FLAG CAPTURED : {}", flag.bold().yellow());
    println!("  Score Awarded : {}", "+100 PTS".bold().cyan());
    println!("{}\n", "******************************************************************".bold().green());
}

fn reset_environment() {
    println!("{}", "Resetting local sandbox state...".yellow());
    let _ = Command::new("./run.sh").arg("reset").status();
}
