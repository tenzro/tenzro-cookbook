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

## Available Tools (31)

Once connected, Claude can use 31 tools:

- **Wallet**: `get_balance`, `create_wallet`, `send_transaction`, `request_faucet`
- **Identity**: `register_identity`, `resolve_did`, `set_delegation_scope`
- **Payments**: `create_payment_challenge`, `verify_payment`, `list_payment_protocols`
- **Models**: `list_models`, `chat_completion`, `list_model_endpoints`
- **Bridge**: `bridge_tokens`, `get_bridge_routes`, `list_bridge_adapters`
- **Staking**: `stake_tokens`, `unstake_tokens`, `register_provider`, `get_provider_stats`
- **Tokens**: `create_token`, `get_token_info`, `list_tokens`, `deploy_contract`, `cross_vm_transfer`, `wrap_tnzo`, `get_token_balance`
- **Verification**: `verify_zk_proof`
- **Network**: `get_node_status`, `get_block`, `get_transaction`

## Example Prompts

- "Create a new wallet on Tenzro and fund it from the faucet"
- "Check the balance of address 0x1234..."
- "List available AI models on the network"
- "Bridge 10 TNZO from Tenzro to Ethereum via LayerZero"
- "Register a human identity named Alice"
