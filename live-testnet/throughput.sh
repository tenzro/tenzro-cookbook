#!/usr/bin/env bash
# Demo 2: Network throughput stress test on live Tenzro testnet
#
# Drives the task marketplace at high concurrency. Each completed task
# triggers a real on-chain TNZO transfer (poster → assignee) via the
# token registry. We measure:
#   - RPC call rate sustained
#   - on-chain settlement rate (txs/sec)
#   - mempool admission vs rate-limited rejections per lane
#   - block range covered, blocks produced during the run
#
# Strategy:
#   - 1 orchestrator + 1 worker (single hot path — simplest signal)
#   - N parallel "iteration runner" workers, each loop:
#     post → quote → assign → complete
#   - Run for $DURATION seconds, then snapshot mempool stats
set -euo pipefail

RPC="${RPC:-https://rpc.tenzro.network}"
CONCURRENCY="${CONCURRENCY:-10}"
DURATION="${DURATION:-30}"
TASK_PRICE="${TASK_PRICE:-1000000000000}"  # 0.000001 TNZO so we can run many iters

call() {
  curl -sS "$RPC" -X POST -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$1\",\"params\":$2}"
}
log() { echo "[$(date +%H:%M:%S)] $*"; }

# ---------------------- Setup ----------------------
log "Spawning orchestrator + worker"
ORCH=$(call tenzro_participate '{}')
ORCH_ADDR=$(echo "$ORCH" | jq -r '.result.wallet.address')
WORK=$(call tenzro_participate '{}')
WORK_ADDR=$(echo "$WORK" | jq -r '.result.wallet.address')
log "  orchestrator: $ORCH_ADDR"
log "  worker:       $WORK_ADDR"

log "Funding both (sequential with 3s spacing)"
F1=$(call tenzro_faucet "{\"address\":\"$ORCH_ADDR\"}")
log "  orch faucet: $(echo "$F1" | jq -r '.result.status // .error.message')"
sleep 3
F2=$(call tenzro_faucet "{\"address\":\"$WORK_ADDR\"}")
log "  work faucet: $(echo "$F2" | jq -r '.result.status // .error.message')"

# Poll until both addresses are funded (up to 60s)
for i in $(seq 1 20); do
  sleep 3
  OB=$(call eth_getBalance "[\"$ORCH_ADDR\",\"latest\"]" | jq -r '.result')
  WB=$(call eth_getBalance "[\"$WORK_ADDR\",\"latest\"]" | jq -r '.result')
  if [[ "$OB" != "0x0" && "$WB" != "0x0" ]]; then
    log "  both funded after $((i*3))s  orch=$OB  work=$WB"
    break
  fi
done

ORCH_BAL=$(call eth_getBalance "[\"$ORCH_ADDR\",\"latest\"]" | jq -r '.result')
WORK_BAL=$(call eth_getBalance "[\"$WORK_ADDR\",\"latest\"]" | jq -r '.result')
log "  orchestrator balance: $ORCH_BAL"
log "  worker balance:       $WORK_BAL"
if [[ "$ORCH_BAL" == "0x0" ]]; then
  echo "ERROR: orchestrator unfunded after polling, aborting"
  exit 1
fi

# Mempool snapshot before
START_BLOCK=$(call eth_blockNumber '[]' | jq -r '.result')
PRE_MEMPOOL=$(call tenzro_getMempoolStats '[]' | jq -c '.result.lanes')
log "  start block: $START_BLOCK"
log "  pre-test mempool: $PRE_MEMPOOL"

# ---------------------- Driver function ----------------------
# Runs in a subshell; spits one line per completed iteration to a per-worker
# log so we can count without inter-process locking.
runner_id=$$
COUNTS_FILE=$(mktemp)
ERRS_FILE=$(mktemp)
end_time=$(( $(date +%s) + DURATION ))

run_one_iter() {
  local widx="$1"
  local task_id quote post c

  post=$(call tenzro_postTask "{
    \"title\":\"stress-t$widx-$(date +%s%N)\",
    \"poster\":\"$ORCH_ADDR\",
    \"max_price\":\"$TASK_PRICE\",
    \"task_type\":\"inference\",
    \"input\":\"x\"
  }")
  task_id=$(echo "$post" | jq -r '.result.task_id // empty')
  if [[ -z "$task_id" ]]; then
    echo "POST $widx $(echo "$post" | jq -c '.error.message')" >> "$ERRS_FILE"
    return
  fi

  if ! quote=$(call tenzro_quoteTask "{\"task_id\":\"$task_id\",\"provider\":\"$WORK_ADDR\",\"price\":\"$TASK_PRICE\"}"); then
    echo "QUOTE $widx" >> "$ERRS_FILE"; return
  fi
  qerr=$(echo "$quote" | jq -r '.error.message // empty')
  [[ -n "$qerr" ]] && { echo "QUOTE $widx $qerr" >> "$ERRS_FILE"; return; }

  call tenzro_assignTask "{\"task_id\":\"$task_id\",\"provider\":\"$WORK_ADDR\",\"quoted_price\":\"$TASK_PRICE\"}" > /dev/null

  c=$(call tenzro_completeTask "{\"task_id\":\"$task_id\",\"output\":\"ok\"}")
  cerr=$(echo "$c" | jq -r '.error.message // empty')
  if [[ -n "$cerr" ]]; then
    echo "COMPLETE $widx $cerr" >> "$ERRS_FILE"
    return
  fi
  echo "1" >> "$COUNTS_FILE"
}

# Each worker loops until end_time
worker_loop() {
  local widx="$1"
  while (( $(date +%s) < end_time )); do
    run_one_iter "$widx"
  done
}

# ---------------------- Drive ----------------------
log "Starting $CONCURRENCY parallel workers for ${DURATION}s"
START_WALL=$(date +%s)
for i in $(seq 1 "$CONCURRENCY"); do
  worker_loop "$i" &
done
wait
END_WALL=$(date +%s)
elapsed=$((END_WALL - START_WALL))

# ---------------------- Measure ----------------------
COMPLETED=$(wc -l < "$COUNTS_FILE" | tr -d ' ')
ERRORS=$(wc -l < "$ERRS_FILE" | tr -d ' ')
END_BLOCK=$(call eth_blockNumber '[]' | jq -r '.result')
POST_MEMPOOL=$(call tenzro_getMempoolStats '[]' | jq -c '.result.lanes')

blocks_produced=$(python3 -c "print(int('$END_BLOCK',16) - int('$START_BLOCK',16))")
echo ""
echo "============ Throughput Summary ============"
echo "Wall time:               ${elapsed}s"
echo "Concurrency:             $CONCURRENCY"
echo "Block range:             $START_BLOCK → $END_BLOCK ($blocks_produced blocks produced)"
echo "Completed iterations:    $COMPLETED"
echo "  → on-chain settlements: $COMPLETED   (real TNZO transfers)"
echo "  → RPC writes per iter:  4 (post + quote + assign + complete)"
echo "  → total RPC writes:     $((COMPLETED * 4))"
if (( elapsed > 0 )); then
  echo "  → settlements/sec:      $(python3 -c "print($COMPLETED/$elapsed)")"
  echo "  → rpc writes/sec:       $(python3 -c "print($COMPLETED*4/$elapsed)")"
fi
echo "Errors:                  $ERRORS"
if (( ERRORS > 0 )); then
  echo "  Top error reasons:"
  head -5 "$ERRS_FILE" | sed 's/^/    /'
fi
echo ""
echo "Pre-test mempool lanes:"
echo "  $PRE_MEMPOOL" | jq -c '.'
echo "Post-test mempool lanes:"
echo "  $POST_MEMPOOL" | jq -c '.'

# Diff admitted/rejected
echo ""
echo "Mempool admission delta:"
python3 - <<EOF
import json
pre = json.loads('''$PRE_MEMPOOL''')
post = json.loads('''$POST_MEMPOOL''')
def lookup(arr, lane):
    return next(x for x in arr if x["lane"]==lane)
for lane in ("verified", "delegated", "open"):
    p = lookup(pre, lane); q = lookup(post, lane)
    da = q["admitted"]                    - p["admitted"]
    dr = q["rejected_rate_limited"]       - p["rejected_rate_limited"]
    df = q["rejected_fee_floor"]          - p["rejected_fee_floor"]
    dm = q["rejected_mempool_full"]       - p["rejected_mempool_full"]
    print(f"  {lane:10s}  admitted:+{da}  rate_limited:+{dr}  fee_floor:+{df}  full:+{dm}")
EOF

rm -f "$COUNTS_FILE" "$ERRS_FILE"
