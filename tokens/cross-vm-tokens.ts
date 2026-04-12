// Cross-VM Token Transfers
// Transfer tokens across EVM, SVM, and Canton using the pointer model.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: List tokens across all VMs
  const token = client.token;
  const allTokens = await token.listTokens();
  console.log("Registered tokens:", allTokens.length);
  for (const t of allTokens) {
    console.log(`  ${t.symbol}: ${t.name} (${t.vm_type})`);
  }

  // Step 2: Check TNZO balance across all VMs
  const balance = await token.getTokenBalance(
    "0xMyAddress1234567890abcdef1234567890abcdef12"
  );
  console.log("\nTNZO balance across VMs:", balance);

  // Step 3: Wrap native TNZO to EVM representation (pointer model -- no-op)
  // In the pointer model, wTNZO on EVM shares the same underlying balance
  const wrapResult = await token.wrapTnzo(
    "1000000000000000000", // 1 TNZO
    "evm"
  );
  console.log("\nWrap result:", wrapResult);

  // Step 4: Cross-VM transfer (atomic, no bridge risk)
  const crossVmResult = await token.crossVmTransfer(
    "TNZO",
    "1000000000000000000", // 1 TNZO
    "evm",  // from VM
    "svm",  // to VM
    "SolanaRecipientPublicKey..."
  );
  console.log("\nCross-VM transfer:", crossVmResult);

  // Step 5: Deploy an ERC-20 contract
  const contract = client.contract;
  const deployed = await contract.deploy(
    "evm",
    "0x608060405234801561001057600080fd5b50...", // bytecode
    []
  );
  console.log("\nContract deployed:", deployed);
}

main().catch(console.error);
