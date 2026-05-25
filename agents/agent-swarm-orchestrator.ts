// Agent Swarm Orchestrator
//
// Provisions a creator wallet via `participate`, registers an
// orchestrator agent, builds a 3-worker swarm with specialised
// capabilities, delegates tasks via the A2A `tasks/send` envelope,
// then synthesises the results with a served LLM and tears the swarm
// down.

import { TenzroClient } from "tenzro-sdk";

async function main() {
  const client = TenzroClient.testnet();

  // Step 1: spawn a creator wallet so agent registration has an owner.
  const creator = await client.provider.participate("");
  console.log("Creator address:", creator.address);

  // Step 2: register the orchestrator agent under that creator.
  const orchestrator = await client.agent.register(
    "research-orchestrator",
    creator.address,
    ["coordination"],
  );
  console.log("Orchestrator:", orchestrator.agent_id);

  // Step 3: create a swarm with specialised workers. The orchestrator
  // owns the swarm; the workers run under it. `parallel: true` lets
  // the orchestrator dispatch tasks concurrently.
  const swarm = await client.agent.createSwarm(
    orchestrator.agent_id,
    [
      { name: "nlp-analyst",     capabilities: ["nlp",  "data"] },
      { name: "code-reviewer",   capabilities: ["code", "smart_contract"] },
      { name: "web-researcher",  capabilities: ["api_integration", "data"] },
    ],
    { parallel: true, task_timeout_secs: 120 },
  );
  console.log("Swarm ID:", swarm.swarm_id);

  // Step 4: spawn two child workers directly under the orchestrator
  // (e.g., for ad-hoc tasks outside the swarm scope).
  const nlpWorker = await client.agent.spawnAgent(
    orchestrator.agent_id,
    "nlp-analyst-adhoc",
    ["nlp", "data"],
  );
  const codeWorker = await client.agent.spawnAgent(
    orchestrator.agent_id,
    "code-reviewer-adhoc",
    ["code", "smart_contract"],
  );
  console.log("Spawned workers:", nlpWorker.agent_id, codeWorker.agent_id);

  // Step 5: delegate tasks via the A2A `tasks/send` envelope. Returns
  // a task ID that can be polled via `tasks/get` for status updates.
  const tasks = await Promise.all([
    client.agent.delegateTask(
      nlpWorker.agent_id,
      "Summarize the latest market chatter about the TNZO token.",
    ),
    client.agent.delegateTask(
      codeWorker.agent_id,
      "Review the staking module for re-entrancy risks.",
    ),
  ]);
  console.log("Tasks delegated:", tasks.map((t) => t.id));

  // Step 6: poll the swarm status.
  const status = await client.agent.getSwarmStatus(swarm.swarm_id);
  console.log("Swarm status:", status.status);

  // Step 7: synthesise the findings via a served LLM. `qwen3-0.6b` is
  // free (0 wei/token), is already serving on the live testnet, and is
  // a sensible default for short summarisation prompts.
  const synthesis = await client.inference.request(
    "qwen3-0.6b",
    "Synthesise these findings into a one-paragraph executive brief.",
    256,
  );
  console.log("Synthesis:", synthesis.output);

  // Step 8: tear the swarm down. Child agents spawned outside the swarm
  // are left running (terminateSwarm only affects swarm members).
  await client.agent.terminateSwarm(swarm.swarm_id);
  console.log("Swarm terminated");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
