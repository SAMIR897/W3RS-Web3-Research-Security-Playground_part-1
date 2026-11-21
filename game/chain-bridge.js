/**
 * ==============================================================================
 * w3rs Game Engine - Blockchain Bridge Daemon
 * ==============================================================================
 * Resilient RPC connection manager for local Anvil (8545) & Solana (8899).
 * Handles offline / standby states without throwing unhandled exceptions.
 */

class ChainBridge {
    constructor() {
        this.evmRpcUrl = "http://127.0.0.1:8545";
        this.solanaRpcUrl = "http://127.0.0.1:8899";
        this.isEvmOnline = false;
        this.isSolanaOnline = false;
        this.currentBlock = 0;
        this.pollInterval = null;
        this.listeners = [];
    }

    init() {
        this.checkHealth();
        this.pollInterval = setInterval(() => this.checkHealth(), 3000);
    }

    onStatusChange(callback) {
        this.listeners.push(callback);
    }

    async checkHealth() {
        let evmStatus = false;
        let blockNumber = 0;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);

            const response = await fetch(this.evmRpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_blockNumber",
                    params: [],
                    id: 1
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.result) {
                    evmStatus = true;
                    blockNumber = parseInt(data.result, 16);
                }
            }
        } catch {
            evmStatus = false;
        }

        this.isEvmOnline = evmStatus;
        this.currentBlock = blockNumber;

        this.listeners.forEach(cb => cb({
            online: this.isEvmOnline,
            block: this.currentBlock
        }));
    }

    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }
}

window.chainBridge = new ChainBridge();
