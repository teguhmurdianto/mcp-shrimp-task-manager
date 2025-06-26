import { z } from "zod";
import { searchTasksWithCommand } from "../../models/taskModel.js";
import { getGetTaskDetailPrompt } from "../../prompts/index.js";

// Parameters for getting full task details
export const getTaskDetailSchema = z.object({
  taskId: z
    .string()
    .min(1, {
      message: "Task ID cannot be empty, please provide a valid task ID",
    })
    .describe("The ID of the task to view details for"),
});

// Get full task details
export async function getTaskDetail({
  taskId,
}: z.infer<typeof getTaskDetailSchema>) {
  try {
    // Use searchTasksWithCommand instead of getTaskById to enable searching in memory
    // Set isId to true for searching by ID; page number 1, page size 1
    const result = await searchTasksWithCommand(taskId, true, 1, 1);

    // Check if task is found
    if (result.tasks.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `## Error\n\nTask with ID \`${taskId}\` not found. Please confirm the task ID is correct.`,
          },
        ],
        isError: true,
      };
    }

    // Get the found task (the first and only one)
    const task = result.tasks[0];

    // Use prompt generator to get final prompt
    const prompt = getGetTaskDetailPrompt({
      taskId,
      task,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: prompt,
        },
      ],
    };
  } catch (error) {
    // Use prompt generator to get error message
    const errorPrompt = getGetTaskDetailPrompt({
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: errorPrompt,
        },
      ],
    };
  }
}
