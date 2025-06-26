/**
 * planTask prompt generator
 * Responsible for combining templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task, TaskDependency } from "../../types/index.js";

/**
 * Interface for planTask prompt parameters
 */
export interface PlanTaskPromptParams {
  description: string;
  requirements?: string;
  existingTasksReference?: boolean;
  completedTasks?: Task[];
  pendingTasks?: Task[];
  memoryDir: string;
}

/**
 * Get the complete prompt for planTask
 * @param params Prompt parameters
 * @returns The generated prompt
 */
export function getPlanTaskPrompt(params: PlanTaskPromptParams): string {
  let tasksContent = "";
  if (
    params.existingTasksReference &&
    params.completedTasks &&
    params.pendingTasks
  ) {
    const allTasks = [...params.completedTasks, ...params.pendingTasks];
    // If tasks exist, add relevant information
    if (allTasks.length > 0) {
      let completeTasksContent = "no completed tasks";

      // Handle completed tasks
      if (params.completedTasks.length > 0) {
        completeTasksContent = "";
        // Display a maximum of 10 completed tasks to avoid overly long prompts
        const tasksToShow =
          params.completedTasks.length > 10
            ? params.completedTasks.slice(0, 10)
            : params.completedTasks;

        tasksToShow.forEach((task, index) => {
          // Generate completion time information (if any)
          const completedTimeText = task.completedAt
            ? `   - completedAt：${task.completedAt.toLocaleString("en-US")}\n`
            : "";

          completeTasksContent += `{index}. **${task.name}** (ID: \`${
            task.id
          }\`)\n   - description：${
            task.description.length > 100
              ? task.description.substring(0, 100) + "..."
              : task.description
          }\n${completedTimeText}`;
          // If not the last task, add a newline
          if (index < tasksToShow.length - 1) {
            completeTasksContent += "\n\n";
          }
        });

        // If there are more tasks, display a hint
        if (params.completedTasks.length > 10) {
          completeTasksContent += `\n\n*(Showing only the first 10, total ${params.completedTasks.length})*\n`;
        }
      }

      let unfinishedTasksContent = "no pending tasks";
      // Handle pending tasks
      if (params.pendingTasks && params.pendingTasks.length > 0) {
        unfinishedTasksContent = "";

        params.pendingTasks.forEach((task, index) => {
          const dependenciesText =
            task.dependencies && task.dependencies.length > 0
              ? `   - dependencies：${task.dependencies
                  .map((dep: TaskDependency) => `\`${dep.taskId}\``)
                  .join(", ")}\n`
              : "";

          unfinishedTasksContent += `${index + 1}. **${task.name}** (ID: \`${
            task.id
          }\`)\n   - description：${
            task.description.length > 150
              ? task.description.substring(0, 150) + "..."
              : task.description
          }\n   - status：${task.status}\n${dependenciesText}`;

          // If not the last task, add a newline
          if (index < (params.pendingTasks?.length ?? 0) - 1) {
            unfinishedTasksContent += "\n\n";
          }
        });
      }

      const tasksTemplate = loadPromptFromTemplate("planTask/tasks.md");
      tasksContent = generatePrompt(tasksTemplate, {
        completedTasks: completeTasksContent,
        unfinishedTasks: unfinishedTasksContent,
      });
    }
  }

  let thoughtTemplate = "";
  if (process.env.ENABLE_THOUGHT_CHAIN !== "false") {
    thoughtTemplate = loadPromptFromTemplate("planTask/hasThought.md");
  } else {
    thoughtTemplate = loadPromptFromTemplate("planTask/noThought.md");
  }
  const indexTemplate = loadPromptFromTemplate("planTask/index.md");
  let prompt = generatePrompt(indexTemplate, {
    description: params.description,
    requirements: params.requirements || "No requirements",
    tasksTemplate: tasksContent,
    rulesPath: "shrimp-rules.md",
    memoryDir: params.memoryDir,
    thoughtTemplate: thoughtTemplate,
  });

  // Load possible custom prompt
  return loadPrompt(prompt, "PLAN_TASK");
}
