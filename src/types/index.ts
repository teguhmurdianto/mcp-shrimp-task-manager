// Task Status Enum: Defines the current stage of a task in the workflow
export enum TaskStatus {
  PENDING = "pending", // Task created but not yet started
  IN_PROGRESS = "in_progress", // Task currently being executed
  COMPLETED = "completed", // Task successfully completed and verified
  BLOCKED = "blocked", // Task temporarily unable to be executed due to dependencies
}

// Task Dependency: Defines prerequisite relationships between tasks
export interface TaskDependency {
  taskId: string; // Unique identifier of the prerequisite task. This dependent task must be completed before the current task can be executed.
}

// Related File Type: Defines the type of relationship between a file and a task
export enum RelatedFileType {
  TO_MODIFY = "TO_MODIFY", // File that needs to be modified in the task
  REFERENCE = "REFERENCE", // Reference material or related documentation for the task
  CREATE = "CREATE", // File that needs to be created in the task
  DEPENDENCY = "DEPENDENCY", // Component or library file that the task depends on
  OTHER = "OTHER", // Other types of related files
}

// Related File: Defines information about files related to a task
export interface RelatedFile {
  path: string; // File path, can be relative to the project root directory or an absolute path
  type: RelatedFileType; // Type of relationship between the file and the task
  description?: string; // Supplementary description of the file, explaining its specific relationship or purpose with the task
  lineStart?: number; // Starting line of the relevant code block (optional)
  lineEnd?: number; // Ending line of the relevant code block (optional)
}

// Task Interface: Defines the complete data structure for a task
export interface Task {
  id: string; // Unique identifier for the task
  name: string; // Concise and clear task name
  description: string; // Detailed task description, including implementation points and acceptance criteria
  notes?: string; // Supplementary notes, special handling requirements, or implementation suggestions (optional)
  status: TaskStatus; // Current execution status of the task
  dependencies: TaskDependency[]; // List of prerequisite dependencies for the task
  createdAt: Date; // Timestamp when the task was created
  updatedAt: Date; // Timestamp when the task was last updated
  completedAt?: Date; // Timestamp when the task was completed (only applicable to completed tasks)
  summary?: string; // Task completion summary, briefly describing implementation results and important decisions (only applicable to completed tasks)
  relatedFiles?: RelatedFile[]; // List of files related to the task (optional)

  // New field: Save complete technical analysis results
  analysisResult?: string; // Complete analysis results from the analyze_task and reflect_task stages

  // New field: Save specific implementation guide
  implementationGuide?: string; // Specific implementation methods, steps, and suggestions

  // New field: Save verification standards and testing methods
  verificationCriteria?: string; // Clear verification standards, testing points, and acceptance criteria
}

// Task Complexity Level: Defines the categorization of task complexity
export enum TaskComplexityLevel {
  LOW = "Low Complexity", // Simple and straightforward task, usually requires no special handling
  MEDIUM = "Medium Complexity", // Task with some complexity but still manageable
  HIGH = "High Complexity", // Complex and time-consuming task, requires special attention
  VERY_HIGH = "Very High Complexity", // Extremely complex task, splitting is recommended
}

// Task Complexity Thresholds: Defines reference standards for task complexity assessment
export const TaskComplexityThresholds = {
  DESCRIPTION_LENGTH: {
    MEDIUM: 500, // Exceeding this word count is considered medium complexity
    HIGH: 1000, // Exceeding this word count is considered high complexity
    VERY_HIGH: 2000, // Exceeding this word count is considered very high complexity
  },
  DEPENDENCIES_COUNT: {
    MEDIUM: 2, // Exceeding this dependency count is considered medium complexity
    HIGH: 5, // Exceeding this dependency count is considered high complexity
    VERY_HIGH: 10, // Exceeding this dependency count is considered very high complexity
  },
  NOTES_LENGTH: {
    MEDIUM: 200, // Exceeding this word count is considered medium complexity
    HIGH: 500, // Exceeding this word count is considered high complexity
    VERY_HIGH: 1000, // Exceeding this word count is considered very high complexity
  },
};

// Task Complexity Assessment Result: Records detailed results of task complexity analysis
export interface TaskComplexityAssessment {
  level: TaskComplexityLevel; // Overall complexity level
  metrics: {
    // Detailed data for various assessment metrics
    descriptionLength: number; // Description length
    dependenciesCount: number; // Dependency count
    notesLength: number; // Notes length
    hasNotes: boolean; // Whether there are notes
  };
  recommendations: string[]; // List of processing recommendations
}
