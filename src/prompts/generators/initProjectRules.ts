/**
 * initProjectRules prompt generator
 * Responsible for combining templates and parameters into the final prompt
 */

import { loadPrompt, loadPromptFromTemplate } from "../loader.js";
/**
 * Interface for initProjectRules prompt parameters
 */
export interface InitProjectRulesPromptParams {
  // Currently no additional parameters, can be extended as needed in the future
}

/**
 * Get the complete prompt for initProjectRules
 * @param params Prompt parameters (optional)
 * @returns The generated prompt
 */
export function getInitProjectRulesPrompt(
  params?: InitProjectRulesPromptParams
): string {
  const indexTemplate = loadPromptFromTemplate("initProjectRules/index.md");

  // Load possible custom prompt (override or append via environment variables)
  return loadPrompt(indexTemplate, "INIT_PROJECT_RULES");
}
