import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { getResearchModePrompt } from "../../prompts/index.js";

// Research mode tool
export const researchModeSchema = z.object({
  topic: z
    .string()
    .min(5, {
      message: "Research topic must be at least 5 characters long; please provide a clear and specific research topic",
    })
    .describe("The programming topic content to research, should be clear and specific"),
  previousState: z
    .string()
    .optional()
    .default("")
    .describe(
      "Previous research status and content summary. Empty on first execution, subsequent executions will include detailed and key previous research results, which will help with future research."
    ),
  currentState: z
    .string()
    .describe(
      "The main content the current Agent should execute, such as using web tools to search for keywords or analyze specific code. After research is complete, please call research_mode to record the state and integrate it with the previous `previousState`. This will help you better save and execute research content."
    ),
  nextSteps: z
    .string()
    .describe(
      "Subsequent plans, steps, or research directions, used to constrain the Agent from deviating from the topic or going in the wrong direction. If the research process reveals a need to adjust the research direction, please update this field."
    ),
});

export async function researchMode({
  topic,
  previousState = "",
  currentState,
  nextSteps,
}: z.infer<typeof researchModeSchema>) {
  // Get base directory path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, "../../..");
  const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");
  const MEMORY_DIR = path.join(DATA_DIR, "memory");

  // Use prompt generator to get final prompt
  const prompt = getResearchModePrompt({
    topic,
    previousState,
    currentState,
    nextSteps,
    memoryDir: MEMORY_DIR,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
