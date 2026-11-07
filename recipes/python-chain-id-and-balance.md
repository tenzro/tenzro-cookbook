# Python: read the chain id and a balance (install from source)

The Python SDK is not yet published to PyPI. Install it from the public tenzro-network repository until it ships.

```bash
git clone https://github.com/tenzro/tenzro-network
pip install ./tenzro-network/sdk/tenzro-py
```

```python
from tenzro import NetworkRpcClient, RpcClient
preview = NetworkRpcClient.connect()
local = RpcClient("http://127.0.0.1:8545")
print(int(local.eth_chain_id(), 16), local.get_balance(["0x<32-byte account address>"]))
```

Replace the placeholder with a real 32-byte address. `NetworkRpcClient.connect()` finds the staked RPC operators on chain; `RpcClient` takes one endpoint.

## What was verified

`pip install` from `sdk/tenzro-py` at `main` succeeds, and `from tenzro import NetworkRpcClient, RpcClient` works; `RpcClient` has `eth_chain_id` and `get_balance`, and `NetworkRpcClient` has `connect`. The calls were not executed against a live endpoint when this recipe was written.

Source: [docs/GUIDE.md, section 0 (Quickstart)](https://github.com/tenzro/tenzro-network/blob/main/docs/GUIDE.md).
