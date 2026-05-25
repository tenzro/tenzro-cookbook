# Connect Tenzro with Claude Desktop

Use Tenzro's MCP server to interact with the blockchain directly from Claude Desktop.

## Setup

Add this to your Claude Desktop MCP configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tenzro": {
      "url": "https://mcp.tenzro.network/mcp"
    }
  }
}
```

## Available Tools

The Tenzro MCP server exposes 192 tools spanning every subsystem of the network. The headline groups:

- **Wallet & Ledger**: `get_balance`, `create_wallet`, `send_transaction`, `request_faucet`
- **Network & Blocks**: `get_node_status`, `get_block`, `get_transaction`
- **Identity & Delegation**: `register_identity`, `resolve_did`, `set_delegation_scope`
- **Payments**: `create_payment_challenge`, `verify_payment`, `list_payment_protocols`
- **AI Models & Inference**: `list_models`, `chat_completion`, `list_model_endpoints`
- **Multi-modal AI** (29 tools): forecast (`forecast`, `list_forecast_models`, ...), vision embed (`image_embed`, `image_text_similarity`, ...), text embed (`text_embed`, ...), segmentation (`segment`, ...), detection (`detect`, ...), audio ASR (`transcribe`, ...), video embed (`video_embed`, ...)
- **Agent Memory**: `memory_grant`, `memory_recall`, `memory_archive`
- **AgentBond & Insurance**: `post_agent_bond`, `get_agent_bond`, `file_insurance_claim`
- **Cross-Chain Bridge**: `bridge_tokens`, `get_bridge_routes`, `list_bridge_adapters`
- **Staking & Providers**: `stake_tokens`, `unstake_tokens`, `register_provider`, `get_provider_stats`
- **Tokens & Contracts**: `create_token`, `get_token_info`, `list_tokens`, `deploy_contract`, `cross_vm_transfer`, `wrap_tnzo`, `get_token_balance`
- **Verification**: `verify_zk_proof`, `verify_vrf_proof`, `generate_vrf_proof`

Specialized ecosystem MCP servers (separate URLs) cover Solana, Ethereum, Canton, LayerZero, Chainlink, and Li.Fi.

## Example Prompts

- "Create a new wallet on Tenzro and fund it from the faucet"
- "Check the balance of address 0x1234..."
- "List available AI models on the network"
- "Embed this image and find the closest match to 'a red car'"
- "Transcribe this audio file using Whisper-v3-turbo"
- "Bridge 10 TNZO from Tenzro to Ethereum via LayerZero"
- "Register a human identity named Alice"
- "Grant a memory to my agent: 'Always prefer USDC over USDT for settlement.'"
