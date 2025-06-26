/**
 * deleteTask prompt generator
 * Responsible for combining templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * Interface for deleteTask prompt parameters
 */
export interface DeleteTaskPromptParams {
  taskId: string;
  task?: Task;
  success?: boolean;
  message?: string;
  isTaskCompleted?: boolean;
}

/**
 * Get the complete prompt for deleteTask
 * @param params Prompt parameters
 * @returns The generated prompt
 */
export function getDeleteTaskPrompt(params: DeleteTaskPromptParams): string {
  const { taskId, task, success, message, isTaskCompleted } = params;

  // Handle case where task does not exist
  if (!task) {
    const notFoundTemplate = loadPromptFromTemplate("deleteTask/notFound.md");
    return generatePrompt(notFoundTemplate, {
      taskId,
    });
  }

  // Handle case where task is completed
  if (isTaskCompleted) {
    const completedTemplate = loadPromptFromTemplate("deleteTask/completed.md");
    return generatePrompt(completedTemplate, {
      taskId: task.id,
      taskName: task.name,
    });
  }

  // Handle success or failure of deletion
  const responseTitle = success ? "Success" : "Failure";
  const indexTemplate = loadPromptFromTemplate("deleteTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    responseTitle,
    message,
  });

  // Load possible custom prompt
  return loadPrompt(prompt, "DELETE_TASK");
}
