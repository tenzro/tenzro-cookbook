// Agent Swarm Orchestrator
// Spawn workers, delegate tasks in parallel, collect results, and synthesize.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register orchestrator agent
  const orchestrator = await client.agent.register(
    "research-orchestrator",
    "Research Orchestrator",
    ["orchestration", "task-management"]
  );
  console.log("Orchestrator:", orchestrator.agent_id);

  // Step 2: Create a swarm with specialized workers
  const swarm = await client.agent.createSwarm(orchestrator.agent_id, [
    { name: "nlp-analyst", capabilities: ["nlp", "sentiment-analysis"] },
    { name: "code-reviewer", capabilities: ["code", "security-audit"] },
    { name: "web-researcher", capabilities: ["web-search", "summarization"] },
  ]);
  console.log("Swarm ID:", swarm.swarm_id);

  // Step 3: Spawn individual workers
  const nlpWorker = await client.agent.spawnAgent(
    orchestrator.agent_id,
    "nlp-analyst",
    ["nlp", "sentiment-analysis"]
  );
  const codeWorker = await client.agent.spawnAgent(
    orchestrator.agent_id,
    "code-reviewer",
    ["code", "security-audit"]
  );

  // Step 4: Delegate tasks in parallel
  const tasks = await Promise.all([
    client.agent.delegateTask(
      nlpWorker.agent_id,
      "Analyze sentiment of recent TNZO market discussions"
    ),
    client.agent.delegateTask(
      codeWorker.agent_id,
      "Review the latest smart contract audit findings"
    ),
  ]);
  console.log("Tasks delegated:", tasks.map((t) => t.id));

  // Step 5: Monitor swarm status
  const status = await client.agent.getSwarmStatus(swarm.swarm_id);
  console.log("Swarm status:", status.status);
  console.log("Members:", status.member_count);

  // Step 6: Synthesize results
  const synthesis = await client.inference.request(
    "gemma3-270m",
    "Synthesize these findings into a brief report.",
    512
  );
  console.log("Synthesis:", synthesis.output);

  // Step 7: Clean up
  await client.agent.terminateSwarm(swarm.swarm_id);
  console.log("Swarm terminated");
}

main().catch(console.error);
