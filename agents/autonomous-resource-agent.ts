/**
 * Autonomous resource agent — discovers resources at runtime, picks
 * the cheapest one matching a capability tag, invokes it, settles in
 * TNZO, attributes usage to the agent's DID.
 *
 * This is the canonical "agent given a task figures out which
 * resource to use" pattern. The agent doesn't hardcode any specific
 * tool / model / MCP — it queries the unified resource catalog at
 * runtime, picks based on price + reputation, and pays per use.
 *
 * Run:
 *   TENZRO_RPC_URL=https://rpc.tenzro.network \
 *   TENZRO_API_KEY=tnz_... \
 *   PAYER_WALLET=0x... \
 *   npx tsx agents/autonomous-resource-agent.ts
 */

import {
  TenzroClient,
  ResourcesClient,
  type ResourceDescriptor,
  type ResourceFilter,
} from '@tenzro/sdk';

async function main() {
  const rpcUrl = process.env.TENZRO_RPC_URL ?? 'https://rpc.tenzro.network';
  const apiKey = process.env.TENZRO_API_KEY;
  const payerWallet = process.env.PAYER_WALLET;

  const client = new TenzroClient({ rpcUrl, apiKey });
  const resources = new ResourcesClient(client.rpc);

  // 1. The agent's goal: get a real-time price for SOL/USD, under 10 mTNZO.
  const filter: ResourceFilter = {
    classes: ['knowledge', 'tool'],
    capability_tags: ['prices'],
    max_tnzo_price: '10000000000000000', // 10 mTNZO in atto-TNZO
    limit: 20,
  };
  const candidates = await resources.list(filter);
  if (candidates.length === 0) {
    console.error('No matching resources found on this operator.');
    process.exit(1);
  }

  // 2. Pick the cheapest available candidate. In practice the agent
  //    would also consider reputation + latency + region.
  candidates.sort((a, b) => {
    const pa = BigInt(a.price_per_call || '0');
    const pb = BigInt(b.price_per_call || '0');
    return pa < pb ? -1 : pa > pb ? 1 : 0;
  });
  const pick: ResourceDescriptor = candidates[0];
  console.log(
    `Picked ${pick.class}/${pick.resource_id} (${pick.name}) @ ${pick.price_per_call} atto-TNZO`,
  );

  // 3. Invoke. Class is auto-detected by the dispatcher; the agent
  //    didn't need to know which registry holds the resource.
  const output = await resources.use({
    resource_id: pick.resource_id,
    params: { symbol: 'SOL/USD' },
    payer_wallet: payerWallet,
  });
  console.log('Result:', JSON.stringify(output, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
