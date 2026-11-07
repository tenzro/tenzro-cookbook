# tenzro-cookbook

Short recipes for building with [Tenzro](https://www.tenzro.com): the SDKs, MCP and wallets. Each recipe says what was actually verified and links to its source.

| Recipe | Language | What it does |
| --- | --- | --- |
| [TypeScript: chain id and balance](recipes/typescript-chain-id-and-balance.md) | TypeScript | Read-only client with `tenzro-sdk` |
| [Rust: chain id and balance](recipes/rust-chain-id-and-balance.md) | Rust | Read-only client with `tenzro-sdk` (compiles) |
| [Python: chain id and balance](recipes/python-chain-id-and-balance.md) | Python | Install from source; PyPI release pending |
| [MCP: check the server](recipes/mcp-check-the-server.md) | curl | `server/discover` against the MCP server |
| [MCP: client config](recipes/mcp-client-config.md) | JSON | Register the server in an MCP client |
| [Passkey wallet](recipes/passkey-wallet.md) | link | Pointer to the live tutorial |

More walkthroughs live in the [tutorials](https://www.tenzro.com/tutorials): governance voting, x402 payments, running a light node, a validator or a provider, and serving a model.

Verification notes: the SDK recipes were checked against the published packages (install, import or compile) but not run against a live endpoint. The MCP recipes are copied from the live tutorial and were not run. See each recipe's "What was verified" section.

Contributing: see [CONTRIBUTING.md](CONTRIBUTING.md). Security: see [SECURITY.md](SECURITY.md). License: Apache 2.0.
