// Cross-VM Token Transfers
// Transfer tokens across EVM, SVM, and Canton using the pointer model.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Provision an identity + wallet so we have a sender address.
  const me = await client.provider.participate("local-password");
  const sender = me.wallet.address;

  // Step 1: List tokens across all VMs
  const token = client.token;
  const allTokens = await token.listTokens();
  console.log("Registered tokens:", allTokens.total);
  for (const t of allTokens.tokens) {
    console.log(`  ${t.symbol}: ${t.name} (${t.vm_type})`);
  }

  // Step 2: Check TNZO balance across all VMs
  const balance = await token.getTokenBalance(sender);
  console.log("\nTNZO balance across VMs:", balance);

  // Step 3: Wrap native TNZO to EVM representation (pointer model -- no-op)
  // In the pointer model, wTNZO on EVM shares the same underlying balance.
  const wrapResult = await token.wrapTnzo(
    sender,
    "1000000000000000000", // 1 TNZO in wei
    "evm"
  );
  console.log("\nWrap result:", wrapResult);

  // Step 4: Cross-VM transfer (atomic, no bridge risk)
  const crossVmResult = await token.crossVmTransfer({
    from_address: sender,
    to_address: "SolanaRecipientPublicKey...",
    amount: "1000000000000000000", // 1 TNZO in wei
    from_vm: "evm",
    to_vm: "svm",
    token: "TNZO",
  });
  console.log("\nCross-VM transfer:", crossVmResult);

  // Step 5: Deploy an ERC-20 contract
  const contract = client.contract;
  const deployed = await contract.deploy({
    bytecode: "0x608060405234801561001057600080fd5b50...",
    vm_type: "evm",
    from: sender,
  });
  console.log("\nContract deployed:", deployed);
}

main().catch(console.error);
