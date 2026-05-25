#!/usr/bin/env bash
# Demo 3: Multi-VM TNZO settlement on live Tenzro testnet
#
# Demonstrates the cross-VM token pointer model (Sei V2 style):
#   - Native TNZO  (18 decimals, ledger account state)
#   - wTNZO ERC-20 (18 decimals, EVM)
#   - wTNZO SPL    ( 9 decimals, SVM — truncated by SPL Token Program)
#   - TNZO holding (18 decimals, DAML / Canton CIP-56)
#
# All four are views over the SAME underlying native balance. There is
# no bridge, no wrap/unwrap escrow, no liquidity fragmentation. A
# cross-VM transfer is an atomic move on one balance, with all 4 views
# updating consistently in the same block.
#
# Flow:
#   1. Spawn 2 fresh agents (sender, receiver) — TDIP identity + MPC wallet each
#   2. Fund sender from faucet (100 TNZO)
#   3. Snapshot all 4 VM views for sender → assert all reconcile
#   4. Drive tenzro_crossVmTransfer (native → evm, 1 TNZO)
#   5. Re-snapshot both addresses → assert pointer model held
#   6. Probe tenzro_submitDamlCommand → confirm Canton API path is reachable
set -euo pipefail

RPC="${RPC:-https://rpc.tenzro.network}"
TRANSFER_AMOUNT_WEI="${TRANSFER_AMOUNT_WEI:-1000000000000000000}"  # 1 TNZO

call() {
  curl -sS "$RPC" -X POST -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$1\",\"params\":$2}"
}
log() { echo "[$(date +%H:%M:%S)] $*"; }
section() { echo ""; echo "============ $* ============"; }

# ------------------------------------------------------------------
section "1/6 Spawn sender + receiver agents (TDIP + MPC wallet)"
SENDER=$(call tenzro_participate '{}')
SENDER_ADDR=$(echo "$SENDER" | jq -r '.result.wallet.address')
SENDER_DID=$(echo "$SENDER" | jq -r '.result.identity.did')
log "  sender:   addr=$SENDER_ADDR"
log "            did=$SENDER_DID"

RECV=$(call tenzro_participate '{}')
RECV_ADDR=$(echo "$RECV" | jq -r '.result.wallet.address')
RECV_DID=$(echo "$RECV" | jq -r '.result.identity.did')
log "  receiver: addr=$RECV_ADDR"
log "            did=$RECV_DID"

# ------------------------------------------------------------------
section "2/6 Fund sender from faucet (100 TNZO)"
F=$(call tenzro_faucet "{\"address\":\"$SENDER_ADDR\"}")
log "  faucet: $(echo "$F" | jq -r '.result.status // .error.message')"

# Poll for funding (180s — faucet uses one MPC wallet, can lag under contention)
for i in $(seq 1 60); do
  sleep 3
  BAL=$(call eth_getBalance "[\"$SENDER_ADDR\",\"latest\"]" | jq -r '.result')
  if [[ "$BAL" != "0x0" ]]; then
    log "  funded after $((i*3))s — balance=$BAL"
    break
  fi
done

if [[ "$BAL" == "0x0" ]]; then
  echo "ERROR: sender unfunded after 180s polling, aborting"
  exit 1
fi

# ------------------------------------------------------------------
section "3/6 Pre-transfer: all 4 VM views for sender"
BEFORE=$(call tenzro_getTokenBalance "{\"address\":\"$SENDER_ADDR\",\"token\":\"TNZO\"}")
echo "$BEFORE" | jq '.result'

# Extract individual view values for later comparison
B_NATIVE=$(echo "$BEFORE" | jq -r '.result.native.balance_wei')
B_EVM=$(echo "$BEFORE"    | jq -r '.result.evm_wtnzo.balance_wei')
B_SVM=$(echo "$BEFORE"    | jq -r '.result.svm_wtnzo.balance_base_units')
B_DAML=$(echo "$BEFORE"   | jq -r '.result.daml_holding.amount_wei')

log "  native:       $B_NATIVE"
log "  evm_wtnzo:    $B_EVM"
log "  svm_wtnzo:    $B_SVM  (SPL 9-dec truncation)"
log "  daml_holding: $B_DAML"

# ------------------------------------------------------------------
section "4/6 Cross-VM transfer: native → evm  (1 TNZO sender → receiver)"
log "  amount: $TRANSFER_AMOUNT_WEI wei (1 TNZO)"
START_BLOCK=$(call eth_blockNumber '[]' | jq -r '.result')
log "  block before: $START_BLOCK"

XFER=$(call tenzro_crossVmTransfer "{
  \"token\":\"TNZO\",
  \"amount\":\"$TRANSFER_AMOUNT_WEI\",
  \"from_vm\":\"native\",
  \"to_vm\":\"evm\",
  \"from_address\":\"$SENDER_ADDR\",
  \"to_address\":\"$RECV_ADDR\"
}")
echo "$XFER" | jq '.'

XFER_ERR=$(echo "$XFER" | jq -r '.error.message // empty')
if [[ -n "$XFER_ERR" ]]; then
  log "  TRANSFER ERROR: $XFER_ERR"
else
  log "  transfer accepted"
fi

# Wait one block for inclusion
sleep 4
END_BLOCK=$(call eth_blockNumber '[]' | jq -r '.result')
log "  block after: $END_BLOCK"

# ------------------------------------------------------------------
section "5/6 Post-transfer: all 4 VM views for SENDER and RECEIVER"

echo "-- sender --"
AFTER_S=$(call tenzro_getTokenBalance "{\"address\":\"$SENDER_ADDR\",\"token\":\"TNZO\"}")
echo "$AFTER_S" | jq '.result'

A_NATIVE=$(echo "$AFTER_S" | jq -r '.result.native.balance_wei')
A_EVM=$(echo "$AFTER_S"    | jq -r '.result.evm_wtnzo.balance_wei')
A_SVM=$(echo "$AFTER_S"    | jq -r '.result.svm_wtnzo.balance_base_units')
A_DAML=$(echo "$AFTER_S"   | jq -r '.result.daml_holding.amount_wei')

log "  native:       $A_NATIVE"
log "  evm_wtnzo:    $A_EVM"
log "  svm_wtnzo:    $A_SVM"
log "  daml_holding: $A_DAML"

echo ""
echo "-- receiver --"
AFTER_R=$(call tenzro_getTokenBalance "{\"address\":\"$RECV_ADDR\",\"token\":\"TNZO\"}")
echo "$AFTER_R" | jq '.result'

R_NATIVE=$(echo "$AFTER_R" | jq -r '.result.native.balance_wei')
R_EVM=$(echo "$AFTER_R"    | jq -r '.result.evm_wtnzo.balance_wei')
R_SVM=$(echo "$AFTER_R"    | jq -r '.result.svm_wtnzo.balance_base_units')
R_DAML=$(echo "$AFTER_R"   | jq -r '.result.daml_holding.amount_wei')

log "  native:       $R_NATIVE"
log "  evm_wtnzo:    $R_EVM"
log "  svm_wtnzo:    $R_SVM"
log "  daml_holding: $R_DAML"

# Reconciliation check: in the pointer model, native should equal evm_wtnzo,
# and svm_wtnzo should equal native / 1e9 (9-dec truncation).
echo ""
section "Pointer model reconciliation"
python3 -c "
def to_int(v):
    if not v or v == 'null': return 0
    return int(v, 16) if v.startswith('0x') else int(v)

rows = [
    ('sender before',  '$B_NATIVE','$B_EVM','$B_SVM','$B_DAML'),
    ('sender after',   '$A_NATIVE','$A_EVM','$A_SVM','$A_DAML'),
    ('receiver after', '$R_NATIVE','$R_EVM','$R_SVM','$R_DAML'),
]
for who, n, e, s, d in rows:
    nv, ev, sv, dv = to_int(n), to_int(e), to_int(s), to_int(d)
    print(f'  {who:18s}  native==evm:{nv==ev}  native==daml:{nv==dv}  svm==native/1e9:{sv == nv // 10**9}')
    print(f'    native:{nv}  evm:{ev}  svm:{sv}  daml:{dv}')

# Conservation check
sb = to_int('$B_NATIVE'); sa = to_int('$A_NATIVE'); ra = to_int('$R_NATIVE')
print()
print(f'  conservation: sender_before == sender_after + receiver_after  ->  {sb == sa + ra}')
print(f'    {sb} == {sa} + {ra} = {sa+ra}')
"

# ------------------------------------------------------------------
section "6/6 Probe Canton/DAML command path"
DAML=$(call tenzro_submitDamlCommand "{
  \"command_type\":\"create\",
  \"template_id\":\"TNZO:Holding\",
  \"party\":\"$SENDER_DID\"
}")
echo "$DAML" | jq '.'

DAML_ERR=$(echo "$DAML" | jq -r '.error.message // empty')
if [[ -n "$DAML_ERR" ]]; then
  log "  DAML path: ERROR ($DAML_ERR)"
else
  log "  DAML path: handler reachable (see Canton envelope above)"
fi

echo ""
section "Demo 3 complete"
