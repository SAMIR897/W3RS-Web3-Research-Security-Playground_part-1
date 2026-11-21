#!/usr/bin/env bash
# ==============================================================================
# w3rs: Dual-Chain Sandbox Manager (Ethereum Anvil + Solana Test Validator)
# ==============================================================================

set -euo pipefail

# Ensure local Web3 binaries are on PATH
export PATH="$HOME/.foundry/bin:$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
PID_DIR="$PROJECT_ROOT/.pids"
SOLANA_LEDGER="$PROJECT_ROOT/.solana_ledger"

mkdir -p "$LOG_DIR" "$PID_DIR"

EVM_PORT=8545
SOLANA_RPC_PORT=8899

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

is_port_in_use() {
    lsof -i :"$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

start_nodes() {
    echo -e "${BOLD}${BLUE}=== Starting w3rs Dual-Chain Sandbox ===${NC}\n"

    # 1. Start Ethereum (Anvil)
    if is_port_in_use $EVM_PORT; then
        echo -e "${YELLOW}[!] Port $EVM_PORT is already running an EVM node.${NC}"
    else
        echo -e "Starting EVM node (Anvil) on port $EVM_PORT..."
        nohup anvil \
            --host 127.0.0.1 \
            --port $EVM_PORT \
            --block-time 1 \
            > "$LOG_DIR/anvil.log" 2>&1 &
        echo $! > "$PID_DIR/anvil.pid"
        sleep 1
        if is_port_in_use $EVM_PORT; then
            echo -e "${GREEN}[✓] EVM Node (Anvil) is LIVE on http://127.0.0.1:$EVM_PORT${NC}"
        else
            echo -e "${RED}[✗] Failed to start Anvil. Check $LOG_DIR/anvil.log${NC}"
        fi
    fi

    # 2. Start Solana (solana-test-validator)
    if is_port_in_use $SOLANA_RPC_PORT; then
        echo -e "${YELLOW}[!] Port $SOLANA_RPC_PORT is already running a Solana node.${NC}"
    else
        echo -e "Starting Solana node on port $SOLANA_RPC_PORT..."
        nohup solana-test-validator \
            --rpc-port $SOLANA_RPC_PORT \
            --ledger "$SOLANA_LEDGER" \
            --quiet \
            --reset \
            > "$LOG_DIR/solana.log" 2>&1 &
        echo $! > "$PID_DIR/solana.pid"
        
        # Wait up to 10 seconds for Solana RPC to be ready
        echo -n "Waiting for Solana RPC to be ready"
        for i in {1..15}; do
            if curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "http://127.0.0.1:$SOLANA_RPC_PORT" | grep -q "ok"; then
                echo ""
                echo -e "${GREEN}[✓] Solana Validator is LIVE on http://127.0.0.1:$SOLANA_RPC_PORT${NC}"
                break
            fi
            echo -n "."
            sleep 1
        done
    fi

    echo -e "\n${BOLD}${GREEN}All sandbox nodes are ready for missions!${NC}"
    print_status
}

stop_nodes() {
    echo -e "${BOLD}${BLUE}=== Stopping w3rs Dual-Chain Sandbox ===${NC}\n"

    # Stop Anvil
    if [ -f "$PID_DIR/anvil.pid" ]; then
        PID=$(cat "$PID_DIR/anvil.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID" || true
            echo -e "${GREEN}[✓] Stopped Anvil (PID $PID)${NC}"
        fi
        rm -f "$PID_DIR/anvil.pid"
    fi
    pkill -f "anvil.*--port $EVM_PORT" 2>/dev/null || true

    # Stop Solana Validator
    if [ -f "$PID_DIR/solana.pid" ]; then
        PID=$(cat "$PID_DIR/solana.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID" || true
            echo -e "${GREEN}[✓] Stopped Solana Validator (PID $PID)${NC}"
        fi
        rm -f "$PID_DIR/solana.pid"
    fi
    pkill -f "solana-test-validator" 2>/dev/null || true

    echo -e "${GREEN}All w3rs sandbox nodes stopped.${NC}"
}

print_status() {
    echo -e "\n${BOLD}--- Node Status Check ---${NC}"
    
    # EVM Check
    if is_port_in_use $EVM_PORT; then
        EVM_BLOCK=$(cast block-number --rpc-url "http://127.0.0.1:$EVM_PORT" 2>/dev/null || echo "Connected")
        echo -e "EVM (Anvil)     : ${GREEN}ONLINE${NC} (RPC: http://127.0.0.1:$EVM_PORT, Block: $EVM_BLOCK)"
    else
        echo -e "EVM (Anvil)     : ${RED}OFFLINE${NC}"
    fi

    # Solana Check
    if is_port_in_use $SOLANA_RPC_PORT; then
        SOL_SLOT=$(solana slot --url "http://127.0.0.1:$SOLANA_RPC_PORT" 2>/dev/null || echo "Connected")
        echo -e "Solana (SVM)    : ${GREEN}ONLINE${NC} (RPC: http://127.0.0.1:$SOLANA_RPC_PORT, Slot: $SOL_SLOT)"
    else
        echo -e "Solana (SVM)    : ${RED}OFFLINE${NC}"
    fi
    echo ""
}

reset_state() {
    echo -e "${BOLD}${YELLOW}=== Resetting w3rs Sandbox State ===${NC}\n"
    stop_nodes
    rm -rf "$SOLANA_LEDGER"
    rm -rf "$LOG_DIR"/*
    echo -e "${GREEN}[✓] Ledgers and temporary state cleared.${NC}"
    start_nodes
}

case "${1:-status}" in
    start)
        start_nodes
        ;;
    stop)
        stop_nodes
        ;;
    status)
        print_status
        ;;
    reset)
        reset_state
        ;;
    logs)
        tail -f "$LOG_DIR/anvil.log" "$LOG_DIR/solana.log"
        ;;
    *)
        echo "Usage: $0 {start|stop|status|reset|logs}"
        exit 1
        ;;
esac
