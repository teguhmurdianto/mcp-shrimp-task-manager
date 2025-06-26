import { z } from "zod";
import {
  getAllTasks,
  batchCreateOrUpdateTasks,
  clearAllTasks as modelClearAllTasks,
} from "../../models/taskModel.js";
import { RelatedFileType, Task } from "../../types/index.js";
import { getSplitTasksPrompt } from "../../prompts/index.js";

// Split tasks tool
export const splitTasksSchema = z.object({
  updateMode: z
    .enum(["append", "overwrite", "selective", "clearAllTasks"])
    .describe(
      "Task update mode selection: 'append' (retain all existing tasks and add new tasks), 'overwrite' (clear all incomplete tasks and completely replace, retain completed tasks), 'selective' (intelligent update: match and update existing tasks based on task name, retain tasks not in the list, recommended for task fine-tuning), 'clearAllTasks' (clear all tasks and create a backup).\nDefaults to 'clearAllTasks' mode. Use other modes only if the user requests changes or modifications to the plan content."
    ),
  tasks: z
    .array(
      z.object({
        name: z
          .string()
          .max(100, {
            message: "Task name is too long, please limit it to within 100 characters",
          })
          .describe("Concise and clear task name, should clearly express the task purpose"),
        description: z
          .string()
          .min(10, {
            message: "Task description is too short, please provide more detailed content to ensure understanding",
          })
          .describe("Detailed task description, including implementation points, technical details, and acceptance criteria"),
        implementationGuide: z
          .string()
          .describe(
            "Specific implementation methods and steps for this task. Please refer to previous analysis results and provide concise pseudocode."
          ),
        dependencies: z
          .array(z.string())
          .optional()
          .describe(
            "List of prerequisite task IDs or task names that this task depends on. Supports two reference methods; name reference is more intuitive. This is a string array."
          ),
        notes: z
          .string()
          .optional()
          .describe("Supplementary notes, special handling requirements, or implementation suggestions (optional)"),
        relatedFiles: z
          .array(
            z.object({
              path: z
                .string()
                .min(1, {
                  message: "文件路徑不能為空",
                })
                .describe("File path, can be relative to the project root directory or an absolute path"),
              type: z
                .nativeEnum(RelatedFileType)
                .describe(
                  "File type (TO_MODIFY: To Modify, REFERENCE: Reference Material, CREATE: To Create, DEPENDENCY: Dependent File, OTHER: Other)"
                ),
              description: z
                .string()
                .min(1, {
                  message: "File description cannot be empty",
                })
                .describe("File description, used to explain the purpose and content of the file"),
              lineStart: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("Starting line of the relevant code block (optional)"),
              lineEnd: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("Ending line of the relevant code block (optional)"),
            })
          )
          .optional()
          .describe(
            "List of files related to the task, used to record code files, reference materials, files to be created, etc., related to the task (optional)"
          ),
        verificationCriteria: z
          .string()
          .optional()
          .describe("Verification standards and testing methods for this specific task"),
      })
    )
    .min(1, {
      message: "Please provide at least one task",
    })
    .describe(
      "Structured task list. Each task should be atomic and have clear completion criteria. Avoid overly simple tasks; simple modifications can be integrated with other tasks to avoid too many tasks."
    ),
  globalAnalysisResult: z
    .string()
    .optional()
    .describe("The final objective of the task, from the previous analysis, applicable to the common parts of all tasks"),
});

export async function splitTasks({
  updateMode,
  tasks,
  globalAnalysisResult,
}: z.infer<typeof splitTasksSchema>) {
  try {
    // Check if there are duplicate task names in tasks
    const nameSet = new Set();
    for (const task of tasks) {
      if (nameSet.has(task.name)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Duplicate task names exist in the tasks parameter. Please ensure each task name is unique.",
            },
          ],
        };
      }
      nameSet.add(task.name);
    }

    // Process tasks based on different update modes
    let message = "";
    let actionSuccess = true;
    let backupFile = null;
    let createdTasks: Task[] = [];
    let allTasks: Task[] = [];

    // Convert task data to the format required by batchCreateOrUpdateTasks
    const convertedTasks = tasks.map((task) => ({
      name: task.name,
      description: task.description,
      notes: task.notes,
      dependencies: task.dependencies,
      implementationGuide: task.implementationGuide,
      verificationCriteria: task.verificationCriteria,
      relatedFiles: task.relatedFiles?.map((file) => ({
        path: file.path,
        type: file.type as RelatedFileType,
        description: file.description,
        lineStart: file.lineStart,
        lineEnd: file.lineEnd,
      })),
    }));

    // Handle clearAllTasks mode
    if (updateMode === "clearAllTasks") {
      const clearResult = await modelClearAllTasks();

      if (clearResult.success) {
        message = clearResult.message;
        backupFile = clearResult.backupFile;

        try {
          // Create new tasks after clearing existing ones
          createdTasks = await batchCreateOrUpdateTasks(
            convertedTasks,
            "append",
            globalAnalysisResult
          );
          message += `\nSuccessfully created ${createdTasks.length} new tasks.`;
        } catch (error) {
          actionSuccess = false;
          message += `\nError occurred while creating new tasks: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      } else {
        actionSuccess = false;
        message = clearResult.message;
      }
    } else {
      // For other modes, use batchCreateOrUpdateTasks directly
      try {
        createdTasks = await batchCreateOrUpdateTasks(
          convertedTasks,
          updateMode,
          globalAnalysisResult
        );

        // Generate message based on different update modes
        switch (updateMode) {
          case "append":
            message = `Successfully appended ${createdTasks.length} new tasks.`;
            break;
          case "overwrite":
            message = `Successfully cleared incomplete tasks and created ${createdTasks.length} new tasks.`;
            break;
          case "selective":
            message = `Successfully selectively updated/created ${createdTasks.length} tasks.`;
            break;
        }
      } catch (error) {
        actionSuccess = false;
        message = `Task creation failed: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    }

    // Get all tasks for displaying dependencies
    try {
      allTasks = await getAllTasks();
    } catch (error) {
      allTasks = [...createdTasks]; // If fetching fails, at least use the newly created tasks
    }

    // Use prompt generator to get final prompt
    const prompt = getSplitTasksPrompt({
      updateMode,
      createdTasks,
      allTasks,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: prompt,
        },
      ],
      ephemeral: {
        taskCreationResult: {
          success: actionSuccess,
          message,
          backupFilePath: backupFile,
        },
      },
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            "Error occurred while executing task splitting: " +
            (error instanceof Error ? error.message : String(error)),
        },
      ],
    };
  }
}

