# TypeScript: read the chain id and a balance

Connect `tenzro-sdk` to a Tenzro endpoint and read the chain id and an account balance. The SDK never signs with a software key, so this recipe is read-only.

```bash
npm install tenzro-sdk
```

```typescript
import pkg from "tenzro-sdk";
const { TenzroClient } = pkg;
const preview = new TenzroClient({ endpoint: "https://rpc.tenzro.com", chainId: 13380 });
const local = new TenzroClient({ endpoint: "http://127.0.0.1:8545", chainId: 1337 });
console.log(await local.getChainId(), await local.getBalance("0x<32-byte account address>"));
```

Replace `0x<32-byte account address>` with a real address. The preview network is chain id 13380 (`https://rpc.tenzro.com`); a local chain from `tenzro dev` is chain id 1337 (`http://127.0.0.1:8545`).

## What was verified

Written against `tenzro-sdk` 0.7.0 from npm. With that version installed, the import resolves and `TenzroClient` exposes `getChainId` and `getBalance`. The calls were not executed against a live endpoint when this recipe was written.

Source: [docs/GUIDE.md, section 0 (Quickstart)](https://github.com/tenzro/tenzro-network/blob/main/docs/GUIDE.md), and the [TypeScript SDK quickstart](https://www.tenzro.com/tutorials/sdk-quickstart-typescript).
