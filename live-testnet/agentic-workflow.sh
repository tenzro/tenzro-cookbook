#!/usr/bin/env bash
# Demo 1: Agentic workflows + autonomy on live Tenzro testnet
#
# Flow:
#  1. Spawn 5 agents (Orchestrator + 4 workers) via tenzro_participate
#     → each gets a TDIP identity + MPC wallet
#  2. Fund each from the faucet (100 TNZO/agent)
#  3. Wait for funding txs to finalize
#  4. Register each in the agent registry (capabilities by role)
#  5. Run N iterations of: orchestrator posts task → worker quotes →
#     orchestrator assigns → worker completes → settlement transfers TNZO
#  6. Report tx counts + final balances
#
# tenzro_completeTask performs the real TNZO transfer from poster to assignee
# via the token registry — every iteration is a real on-chain settlement.
set -euo pipefail

RPC="${RPC:-https://rpc.tenzro.network}"
ITERATIONS="${ITERATIONS:-20}"
TASK_PRICE_WEI="${TASK_PRICE_WEI:-1000000000000000000}"  # 1 TNZO max_price
QUOTE_PRICE_WEI="${QUOTE_PRICE_WEI:-900000000000000000}"  # 0.9 TNZO quote

call() {
  local method="$1"; shift
  local params="${1:-{}}"
  curl -sS "$RPC" -X POST -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}"
}

log() { echo "[$(date +%H:%M:%S)] $*"; }
section() { echo ""; echo "============ $* ============"; }

# ----------------------------------------------------------------------
section "1/6 Spawn agent identities (TDIP + MPC wallet via participate)"
ROLES=(orch code data trade res)
declare -A NAMES=( [orch]=Orchestrator [code]=CodeWorker [data]=DataWorker [trade]=TradeWorker [res]=ResearchWorker )
declare -A DID ADDR WALLET

for role in "${ROLES[@]}"; do
  resp=$(call tenzro_participate '{}')
  DID[$role]=$(echo "$resp" | jq -r '.result.identity.did')
  ADDR[$role]=$(echo "$resp" | jq -r '.result.wallet.address')
  WALLET[$role]=$(echo "$resp" | jq -r '.result.wallet.wallet_id')
  log "spawned ${NAMES[$role]}  did=${DID[$role]:0:42}…  addr=${ADDR[$role]:0:18}…"
done

# ----------------------------------------------------------------------
section "2/6 Fund agents from faucet"
declare -A FAUCET_TX
for role in "${ROLES[@]}"; do
  resp=$(call tenzro_faucet "{\"address\":\"${ADDR[$role]}\"}")
  tx=$(echo "$resp" | jq -r '.result.tx_hash // .result.transaction_hash // .result // "ERR"')
  err=$(echo "$resp" | jq -r '.error.message // empty')
  if [[ -n "$err" ]]; then
    log "  ${NAMES[$role]}: faucet error: $err"
    FAUCET_TX[$role]="ERR"
  else
    log "  ${NAMES[$role]}: faucet_tx=${tx:0:32}…"
    FAUCET_TX[$role]="$tx"
  fi
done

# ----------------------------------------------------------------------
section "3/6 Wait for funding tx finalization"
START_BLOCK=$(call eth_blockNumber '[]' | jq -r '.result')
log "current block: $START_BLOCK — waiting for next 2 blocks (~10s)…"
sleep 12

# Verify funding
ALL_FUNDED=1
for role in "${ROLES[@]}"; do
  bal=$(call eth_getBalance "[\"${ADDR[$role]}\",\"latest\"]" | jq -r '.result')
  bal_dec=$(python3 -c "print(int('$bal',16))")
  if [[ "$bal_dec" -gt 0 ]]; then
    log "  ${NAMES[$role]}: balance=$bal ($((bal_dec / 10**18)) TNZO)"
  else
    log "  ${NAMES[$role]}: STILL 0 — waiting another 10s"
    ALL_FUNDED=0
  fi
done
if [[ "$ALL_FUNDED" -eq 0 ]]; then
  sleep 10
  for role in "${ROLES[@]}"; do
    bal=$(call eth_getBalance "[\"${ADDR[$role]}\",\"latest\"]" | jq -r '.result')
    bal_dec=$(python3 -c "print(int('$bal',16))")
    log "  retry ${NAMES[$role]}: balance=$bal ($((bal_dec / 10**18)) TNZO)"
  done
fi

# ----------------------------------------------------------------------
section "4/6 Register agents in registry"
declare -A AID
for role in "${ROLES[@]}"; do
  caps='["nlp","blockchain"]'
  [[ "$role" == "code" ]] && caps='["code","nlp"]'
  [[ "$role" == "data" ]] && caps='["data","nlp"]'
  [[ "$role" == "trade" ]] && caps='["blockchain","data"]'
  [[ "$role" == "res" ]]   && caps='["nlp","data"]'
  resp=$(call tenzro_registerAgent "{
    \"name\":\"demo-${role}-$(date +%s)\",
    \"creator\":\"${ADDR[$role]}\",
    \"capabilities\":$caps
  }")
  aid=$(echo "$resp" | jq -r '.result.agent_id // .result.id // "n/a"')
  err=$(echo "$resp" | jq -r '.error.message // empty')
  if [[ -n "$err" ]]; then
    log "  ${NAMES[$role]}: REGISTER ERROR: $err"
  fi
  AID[$role]="$aid"
  log "  ${NAMES[$role]}: agent_id=${aid:0:42}…"
done

# ----------------------------------------------------------------------
section "5/6 Agentic loop x $ITERATIONS — real on-chain task settlement"
POSTED=0; QUOTED=0; ASSIGNED=0; COMPLETED=0; SETTLED_WEI=0
start_time=$(date +%s)
LOOP_START_BLOCK=$(call eth_blockNumber '[]' | jq -r '.result')

for i in $(seq 1 "$ITERATIONS"); do
  worker_roles=(code data trade res)
  worker=${worker_roles[$(( (i-1) % 4 ))]}

  task_type="inference"
  [[ "$worker" == "data" ]]  && task_type="data_analysis"
  [[ "$worker" == "trade" ]] && task_type="agent_execution"
  [[ "$worker" == "res" ]]   && task_type="research"
  [[ "$worker" == "code" ]]  && task_type="code_review"

  # POST
  post=$(call tenzro_postTask "{
    \"title\":\"Iter-$i: ${NAMES[$worker]}\",
    \"description\":\"Autonomous demo workflow iteration $i\",
    \"poster\":\"${ADDR[orch]}\",
    \"max_price\":\"$TASK_PRICE_WEI\",
    \"task_type\":\"$task_type\",
    \"input\":\"demo input for iteration $i\"
  }")
  task_id=$(echo "$post" | jq -r '.result.task_id // empty')
  if [[ -z "$task_id" ]]; then
    log "  [$i] POST FAILED: $(echo "$post" | jq -c '.error')"
    continue
  fi
  POSTED=$((POSTED+1))

  # QUOTE
  q=$(call tenzro_quoteTask "{
    \"task_id\":\"$task_id\",
    \"provider\":\"${ADDR[$worker]}\",
    \"price\":\"$QUOTE_PRICE_WEI\",
    \"confidence\":85,
    \"estimated_duration_secs\":60
  }")
  qerr=$(echo "$q" | jq -r '.error.message // empty')
  if [[ -n "$qerr" ]]; then log "  [$i] QUOTE FAILED: $qerr"; continue; fi
  QUOTED=$((QUOTED+1))

  # ASSIGN
  a=$(call tenzro_assignTask "{
    \"task_id\":\"$task_id\",
    \"provider\":\"${ADDR[$worker]}\",
    \"quoted_price\":\"$QUOTE_PRICE_WEI\"
  }")
  aerr=$(echo "$a" | jq -r '.error.message // empty')
  if [[ -n "$aerr" ]]; then log "  [$i] ASSIGN FAILED: $aerr"; continue; fi
  ASSIGNED=$((ASSIGNED+1))

  # COMPLETE — triggers real on-chain TNZO transfer (poster → assignee)
  c=$(call tenzro_completeTask "{
    \"task_id\":\"$task_id\",
    \"output\":\"Iter $i complete: ${NAMES[$worker]} delivered $task_type result\"
  }")
  cerr=$(echo "$c" | jq -r '.error.message // empty')
  if [[ -n "$cerr" ]]; then log "  [$i] COMPLETE FAILED: $cerr"; continue; fi
  COMPLETED=$((COMPLETED+1))
  SETTLED_WEI=$((SETTLED_WEI + QUOTE_PRICE_WEI))

  if (( i % 5 == 0 )); then
    log "  [$i/$ITERATIONS] posted=$POSTED quoted=$QUOTED assigned=$ASSIGNED completed=$COMPLETED"
  fi
done

elapsed=$(( $(date +%s) - start_time ))
END_BLOCK=$(call eth_blockNumber '[]' | jq -r '.result')

# ----------------------------------------------------------------------
section "6/6 Summary"
echo "Wall time:            ${elapsed}s"
echo "Block range:          $LOOP_START_BLOCK → $END_BLOCK"
echo "Posted:               $POSTED / $ITERATIONS"
echo "Quoted:               $QUOTED / $ITERATIONS"
echo "Assigned:             $ASSIGNED / $ITERATIONS"
echo "Completed (settled):  $COMPLETED / $ITERATIONS"
echo "Total marketplace RPCs: $((POSTED + QUOTED + ASSIGNED + COMPLETED))"
settled_tnzo=$(python3 -c "print($SETTLED_WEI / 10**18)")
echo "TNZO settled:         ${settled_tnzo} TNZO (poster → workers, real transfers)"
echo ""
echo "Final balances:"
for role in "${ROLES[@]}"; do
  bal=$(call eth_getBalance "[\"${ADDR[$role]}\",\"latest\"]" | jq -r '.result')
  bal_tnzo=$(python3 -c "print(int('$bal',16) / 10**18)")
  printf "  %-15s  %22s wei  (%.4f TNZO)  %s\n" "${NAMES[$role]}" "$bal" "$bal_tnzo" "${ADDR[$role]:0:20}..."
done
