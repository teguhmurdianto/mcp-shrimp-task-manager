import { z } from "zod";
import { getInitProjectRulesPrompt } from "../../prompts/index.js";

// Define schema
export const initProjectRulesSchema = z.object({});

/**
 * Initialize project rules tool function
 * Provides guidance for creating rule documents
 */
export async function initProjectRules() {
  try {
    // Get prompt from generator
    const promptContent = getInitProjectRulesPrompt();

    // Return success response
    return {
      content: [
        {
          type: "text" as const,
          text: promptContent,
        },
      ],
    };
  } catch (error) {
    // Error handling
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text" as const,
          text: `Error initializing project rules: ${errorMessage}`,
        },
      ],
    };
  }
}
