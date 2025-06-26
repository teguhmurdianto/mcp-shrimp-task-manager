/**
 * Prompt Loader
 * Provides functionality to load custom prompts from environment variables
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processEnvString(input: string | undefined): string {
  if (!input) return "";

  return input
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

/**
 * Loads a prompt, supporting environment variable customization
 * @param basePrompt The base prompt content
 * @param promptKey The key name for the prompt, used to generate the environment variable name
 * @returns The final prompt content
 */
export function loadPrompt(basePrompt: string, promptKey: string): string {
  // Convert to uppercase as part of the environment variable
  const envKey = promptKey.toUpperCase();

  // Check for override environment variable
  const overrideEnvVar = `MCP_PROMPT_${envKey}`;
  if (process.env[overrideEnvVar]) {
    // Completely replace the original prompt with the environment variable
    return processEnvString(process.env[overrideEnvVar]);
  }

  // Check for append environment variable
  const appendEnvVar = `MCP_PROMPT_${envKey}_APPEND`;
  if (process.env[appendEnvVar]) {
    // Append the environment variable content after the original prompt
    return `${basePrompt}\n\n${processEnvString(process.env[appendEnvVar])}`;
  }

  // If no custom content, use the original prompt
  return basePrompt;
}

/**
 * Generates a prompt with dynamic parameters
 * @param promptTemplate The prompt template
 * @param params Dynamic parameters
 * @returns The prompt with parameters filled in
 */
export function generatePrompt(
  promptTemplate: string,
  params: Record<string, any> = {}
): string {
  // Use simple template replacement to replace {paramName} with corresponding parameter values
  let result = promptTemplate;

  Object.entries(params).forEach(([key, value]) => {
    // If the value is undefined or null, replace with an empty string
    const replacementValue =
      value !== undefined && value !== null ? String(value) : "";

    // Use regular expression to replace all matching placeholders
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(placeholder, replacementValue);
  });

  return result;
}

/**
 * Loads a prompt from a template
 * @param templatePath The template path relative to the template set root directory (e.g., 'chat/basic.md')
 * @returns The template content
 * @throws Error if the template file is not found
 */
export function loadPromptFromTemplate(templatePath: string): string {
  const templateSetName = process.env.TEMPLATES_USE || "en";
  const dataDir = process.env.DATA_DIR;
  const builtInTemplatesBaseDir = __dirname;

  let finalPath = "";
  const checkedPaths: string[] = []; // For more detailed error reporting

  // 1. Check for custom path in DATA_DIR
  if (dataDir) {
    // path.resolve can handle cases where templateSetName is an absolute path
    const customFilePath = path.resolve(dataDir, templateSetName, templatePath);
    checkedPaths.push(`Custom: ${customFilePath}`);
    if (fs.existsSync(customFilePath)) {
      finalPath = customFilePath;
    }
  }

  // 2. If custom path not found, check specific built-in template directory
  if (!finalPath) {
    // Assume templateSetName is 'en', 'zh', etc. for built-in templates
    const specificBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      `templates_${templateSetName}`,
      templatePath
    );
    checkedPaths.push(`Specific Built-in: ${specificBuiltInFilePath}`);
    if (fs.existsSync(specificBuiltInFilePath)) {
      finalPath = specificBuiltInFilePath;
    }
  }

  // 3. If specific built-in template not found, and not 'en' (to avoid duplicate checks)
  if (!finalPath && templateSetName !== "en") {
    const defaultBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      "templates_en",
      templatePath
    );
    checkedPaths.push(`Default Built-in ('en'): ${defaultBuiltInFilePath}`);
    if (fs.existsSync(defaultBuiltInFilePath)) {
      finalPath = defaultBuiltInFilePath;
    }
  }

  // 4. If template not found in any path, throw error
  if (!finalPath) {
    throw new Error(
      `Template file not found: '${templatePath}' in template set '${templateSetName}'. Checked paths:\n - ${checkedPaths.join(
        "\n - "
      )}`
    );
  }

  // 5. Read the found file
  return fs.readFileSync(finalPath, "utf-8");
}
