import { inputPrompt } from "@reliverse/prompts";

import { advancedBunUsage } from "./cli/bun-example/bun-mod.js";
import { advancedCoreUsage } from "./cli/core-example/core-mod.js";
import { advancedWebUsage } from "./cli/web-example/web-mod.js";

export async function exampleUsage() {
  const prompt = await inputPrompt({
    title:
      "What example do you want to see?\n\n1 - Core\n(This uses the the core library memory adapter. Great for Node, local dev, or test scenarios.)\n\n2 - Bun\n(This uses an async adapter that leverages Bun's native Redis client. Perfect for production-scale caching and concurrency.)\n\n3 - Web\n(This uses the universal/web-based adapter. If it's in a browser, it tries localStorage; if not, it falls back to the in-memory adapter. Great for front-end apps storing ephemeral user data or sessions.)",
  });

  if (prompt === "1") {
    await advancedCoreUsage();
  } else if (prompt === "2") {
    await advancedBunUsage();
  } else if (prompt === "3") {
    await advancedWebUsage();
  } else {
    console.log("Invalid option");
  }
}
