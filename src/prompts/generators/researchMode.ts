/**
 * researchMode prompt generator
 * Responsible for combining templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";

/**
 * Interface for researchMode prompt parameters
 */
export interface ResearchModePromptParams {
  topic: string;
  previousState: string;
  currentState: string;
  nextSteps: string;
  memoryDir: string;
}

/**
 * Get the complete prompt for researchMode
 * @param params Prompt parameters
 * @returns The generated prompt
 */
export function getResearchModePrompt(
  params: ResearchModePromptParams
): string {
  // Handle previous research state
  let previousStateContent = "";
  if (params.previousState && params.previousState.trim() !== "") {
    const previousStateTemplate = loadPromptFromTemplate(
      "researchMode/previousState.md"
    );
    previousStateContent = generatePrompt(previousStateTemplate, {
      previousState: params.previousState,
    });
  } else {
    previousStateContent = "This is the first research on this topic; no previous research state exists.";
  }

  // Load main template
  const indexTemplate = loadPromptFromTemplate("researchMode/index.md");
  let prompt = generatePrompt(indexTemplate, {
    topic: params.topic,
    previousStateContent: previousStateContent,
    currentState: params.currentState,
    nextSteps: params.nextSteps,
    memoryDir: params.memoryDir,
    time: new Date().toLocaleString(),
  });

  // Load possible custom prompt
  return loadPrompt(prompt, "RESEARCH_MODE");
}
