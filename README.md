# Tenzro Cookbook

Practical examples and recipes for building on the Tenzro Network. Each example is self-contained, runnable, and uses the real Tenzro SDK methods.

**Tenzro Network** is a decentralized protocol for the AI age -- enabling humans and agents to access AI models (intelligence), TEE enclaves (security), and settle payments in TNZO.

## Quickstart

```bash
# TypeScript
npm install tenzro-sdk

# Rust
cargo add tenzro-sdk
```

All TypeScript examples connect to the public testnet at `https://rpc.tenzro.network`.

## Table of Contents

### Getting Started
| Example | Description |
|---------|-------------|
| [Rust Quickstart](getting-started/rust-quickstart.rs) | Connect, create wallet, send TNZO, run inference -- in Rust |
| [TypeScript Quickstart](getting-started/typescript-quickstart.ts) | Connect, create wallet, send TNZO, run inference -- in TypeScript |
| [Connect with Claude](getting-started/connect-with-claude.md) | Use Tenzro's MCP server with Claude Desktop |

### Wallets
| Example | Description |
|---------|-------------|
| [Create Agentic Wallet](wallets/create-agentic-wallet.ts) | Register identity, create wallet, fund from faucet |
| [Custody App](wallets/custody-app.ts) | MPC threshold wallet with spending policies and session keys |
| [Paymaster App](wallets/paymaster-app.ts) | Developer-funded gasless app with AppClient |

### AI Agents
| Example | Description |
|---------|-------------|
| [Agent Swarm Orchestrator](agents/agent-swarm-orchestrator.ts) | Multi-agent swarm with parallel task delegation |
| [Network Plugin Agent](agents/network-plugin-agent.ts) | Agent with skills and tool registry integration |
| [Institutional AML Agent](agents/institutional-aml-agent.ts) | AML compliance agent with TEE and ZK proofs |
| [AI Coding Assistant](agents/ai-coding-assistant.ts) | Streaming inference agent with payment integration |

### DeFi
| Example | Description |
|---------|-------------|
| [Cross-Chain DeFi](defi/cross-chain-defi.ts) | Bridge tokens and execute cross-chain operations |
| [Cross-Chain Arbitrage](defi/cross-chain-arbitrage.ts) | Monitor and execute cross-chain arbitrage |
| [Yield Router](defi/yield-router.ts) | Auto-route funds to highest yield across chains |
| [DCA Agent](defi/dca-agent.ts) | Dollar-cost averaging agent with scheduled buys |

### Bridge
| Example | Description |
|---------|-------------|
| [deBridge Swap](bridge/debridge-swap.ts) | Cross-chain swap via deBridge DLN |
| [LayerZero Bridge](bridge/layerzero-bridge.ts) | OFT transfer via LayerZero V2 |

### Tokens
| Example | Description |
|---------|-------------|
| [NFT Marketplace](tokens/nft-marketplace.ts) | Create collections, mint NFTs, list for sale |
| [Compliance Token](tokens/compliance-token.ts) | ERC-3643 regulated token with KYC enforcement |
| [Cross-VM Tokens](tokens/cross-vm-tokens.ts) | Transfer tokens across EVM, SVM, and Canton |

### Security
| Example | Description |
|---------|-------------|
| [Encrypted Messaging](security/encrypted-messaging.ts) | E2E encrypted chat with X25519 + AES-256-GCM |
| [TEE Confidential Compute](security/tee-confidential-compute.ts) | TEE attestation, data sealing, and verification |
| [ZK Proof Verification](security/zk-proof-verification.ts) | Groth16 proof generation and verification |

### Payments
| Example | Description |
|---------|-------------|
| [MPP Payment](payments/mpp-payment.ts) | Machine Payments Protocol (Stripe + Tempo) |
| [x402 Payment](payments/x402-payment.ts) | Coinbase x402 stateless payment |

### Models
| Example | Description |
|---------|-------------|
| [Model Serving Provider](models/model-serving-provider.ts) | Download, serve, and monetize AI models |

### Institutional
| Example | Description |
|---------|-------------|
| [Canton DvP](institutional/canton-dvp.ts) | Delivery vs Payment on Canton DAML ledger |
| [AML Agent](institutional/aml-agent.ts) | Institutional AML with Canton settlement |

## Running Examples

### TypeScript
```bash
npx tsx getting-started/typescript-quickstart.ts
```

### Rust
```bash
rustc getting-started/rust-quickstart.rs -o quickstart && ./quickstart
# Or add to a Cargo project with tenzro-sdk dependency
```

## Testnet

| Service | URL |
|---------|-----|
| JSON-RPC | `https://rpc.tenzro.network` |
| Web API | `https://api.tenzro.network` |
| Faucet | `https://api.tenzro.network/api/faucet` |
| MCP Server | `https://mcp.tenzro.network/mcp` |

Request testnet TNZO: 100 TNZO per request, 24h cooldown.

## License

Apache 2.0
