# Live-Testnet Demos

Three self-contained shell drivers that exercise the Tenzro testnet through
raw JSON-RPC. No SDK, no CLI, no toolchain — only `curl`, `jq`, and
`python3` (for arithmetic).

All three run against `https://rpc.tenzro.network` out of the box.

| Script | Demonstrates |
|--------|--------------|
| [`agentic-workflow.sh`](agentic-workflow.sh) | Autonomous agents spawn identities, fund themselves, register capabilities, post tasks, quote, assign, and settle in TNZO |
| [`throughput.sh`](throughput.sh) | Sustained marketplace cycle throughput under N parallel workers — measures settlements/sec, RPC writes/sec, mempool admission deltas |
| [`multivm-settlement.sh`](multivm-settlement.sh) | The pointer-model invariant: one balance, four VM views (`native` / `evm_wtnzo` / `svm_wtnzo` / `daml_holding`), atomic cross-VM transfer, conservation check |

## Quickstart

```bash
# Agentic workflow — 20 iterations of post→quote→assign→complete
./agentic-workflow.sh

# Throughput — 30 parallel workers for 30 seconds
CONCURRENCY=30 DURATION=30 ./throughput.sh

# Multi-VM — 1 TNZO native→evm transfer, snapshot all 4 views
./multivm-settlement.sh
```

Each script prints a section-by-section trace and ends with a summary block.

## What each script does (one line)

### `agentic-workflow.sh`

Spawns 5 agents (Orchestrator + Code/Data/Trade/Research workers) via
`tenzro_participate`, funds each from `tenzro_faucet`, registers them with
typed capabilities via `tenzro_registerAgent`, then loops `tenzro_postTask`
→ `tenzro_quoteTask` → `tenzro_assignTask` → `tenzro_completeTask` for N
iterations. Every completion triggers a real on-chain TNZO transfer
(poster → assignee) through the unified token registry.

Tunables: `ITERATIONS` (default 20), `TASK_PRICE_WEI` (default 1 TNZO),
`QUOTE_PRICE_WEI` (default 0.9 TNZO).

### `throughput.sh`

Spawns 1 orchestrator + 1 worker, funds both, then runs `CONCURRENCY`
parallel workers driving the marketplace cycle for `DURATION` seconds.
Records pre/post `tenzro_getMempoolStats` snapshots and diffs admission
counters per lane (verified / delegated / open). Reports settlements/sec,
RPC writes/sec, blocks produced, and errors.

Tunables: `CONCURRENCY` (default 10), `DURATION` (default 30 sec),
`TASK_PRICE` (default 0.000001 TNZO).

**Honest note:** the marketplace path writes directly to RocksDB CF_TASKS
+ token registry; it does **not** transit the mempool. Mempool admission
deltas will be zero by design. To measure peak signed-tx throughput via
`eth_sendRawTransaction` (which does hit the mempool), a hybrid-PQ-capable
load driver is needed — every signed tx requires Ed25519 + ML-DSA-65
(3309-byte signature).

### `multivm-settlement.sh`

Spawns two fresh agents, funds the sender from the faucet, snapshots all
four VM views of the sender's balance via `tenzro_getTokenBalance`, drives
a `tenzro_crossVmTransfer` (native → evm), re-snapshots both addresses,
and asserts:

| Invariant | What it means |
|-----------|---------------|
| `native == evm_wtnzo` | EVM view tracks the underlying native balance 1:1 (18 decimals) |
| `native == daml_holding` | Canton view tracks the underlying balance 1:1 (18 decimals) |
| `svm_wtnzo == native / 10^9` | SVM view is the SPL Token Program's 9-decimal truncation |
| sender_before == sender_after + receiver_after | Conservation across the transfer |

Tunable: `TRANSFER_AMOUNT_WEI` (default 1 TNZO).

**Honest note:** the script also probes `tenzro_submitDamlCommand` and the
handler returns a typed Canton envelope, but there is no live Canton
participant deployed alongside this testnet. What the demo actually
*proves* about the DAML side is that `daml_holding` is a real view of the
underlying balance (the post-transfer delta confirms this). Wiring an
actual Canton participant is a separate deploy.

## Prerequisites

```bash
# macOS
brew install jq

# Debian / Ubuntu
sudo apt-get install -y jq python3

# Fedora
sudo dnf install -y jq python3
```

Network: outbound HTTPS to `rpc.tenzro.network`.

## Custom RPC endpoint

All three scripts accept `RPC` as an environment variable:

```bash
RPC=http://localhost:8545 ./agentic-workflow.sh
```

## Expected results (against live testnet, 2026-05-13)

| Script | Result |
|--------|--------|
| `agentic-workflow.sh` (20 iter) | 20/20 success, 80 RPC writes, ~18 TNZO settled |
| `throughput.sh` (C=30, D=30) | ~247 settlements in 33s, 7.5/s, 0 errors |
| `multivm-settlement.sh` (1 TNZO) | All 4 invariants pass, conservation holds |

Faucet lag varies: the testnet faucet uses a single MPC wallet and
sequentially signs under load. Polling windows in each script are
generous (60–180 s) to handle this — that's normal, not a failure.
