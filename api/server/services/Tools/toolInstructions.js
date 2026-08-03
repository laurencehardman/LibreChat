const fs = require('fs');
const path = require('path');
const { logger } = require('@librechat/data-schemas');

/**
 * Runtime-overridable tool instructions.
 *
 * Instruction files are plain text files loaded from `TOOL_INSTRUCTIONS_DIR`
 * (default: `<cwd>/config/tool-instructions`, i.e. `/app/config/tool-instructions`
 * in the Docker image — bind-mount it to edit instructions without rebuilding):
 *
 *   <tool_name>.md              → prompt instructions injected into the system
 *                                 prompt for that tool (replaces the built-in block)
 *   <tool_name>.description.md  → the tool's `description` sent in the model's
 *                                 tool/function definition (replaces the registry text)
 *
 * `.txt` is accepted as an alternative extension. Files are re-read when their
 * modification time changes, so edits apply to new requests without a restart.
 */

const EXTENSIONS = ['.md', '.txt'];

/** filePath → { mtimeMs, content } cache; entries are invalidated by mtime changes. */
const fileCache = new Map();

function getInstructionsDir() {
  return (
    process.env.TOOL_INSTRUCTIONS_DIR ||
    path.resolve(process.cwd(), 'config', 'tool-instructions')
  );
}

/**
 * Reads a file for the given baseName, revalidating against mtime.
 * @param {string} baseName - `<tool_name>` for instructions, `<tool_name>.description` for descriptions.
 * @returns {Promise<string | null>} Trimmed file content, or null when no file exists / file is empty.
 */
async function readFile(baseName) {
  const dir = getInstructionsDir();
  for (const ext of EXTENSIONS) {
    const filePath = path.join(dir, `${baseName}${ext}`);
    let stat;
    try {
      stat = await fs.promises.stat(filePath);
    } catch {
      continue;
    }
    if (!stat.isFile()) {
      continue;
    }
    const cached = fileCache.get(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.content;
    }
    try {
      const content = (await fs.promises.readFile(filePath, 'utf8')).trim();
      fileCache.set(filePath, { mtimeMs: stat.mtimeMs, content });
      return content.length > 0 ? content : null;
    } catch (error) {
      logger.warn(`[toolInstructions] Failed to read "${filePath}":`, error);
      return null;
    }
  }
  return null;
}

/**
 * Returns the prompt instructions for a tool from `config/tool-instructions/<toolName>.md`,
 * or null when no file exists. Callers should provide their own fallback.
 * @param {string} toolName
 * @returns {Promise<string | null>}
 */
function getToolInstruction(toolName) {
  return readFile(toolName);
}

/**
 * Resolves a description override for a tool (`<tool_name>.description.md`), or null.
 * @param {string} toolName
 * @returns {Promise<string | null>}
 */
function getToolDescriptionOverride(toolName) {
  return readFile(`${toolName}.description`);
}

/**
 * Applies `<tool_name>.description.md` overrides onto a tool definitions array.
 * Definitions whose tool has no override file are returned untouched.
 * @template {{ name: string; description?: string }} T
 * @param {T[]} toolDefinitions
 * @returns {Promise<T[]>}
 */
async function applyToolDescriptionOverrides(toolDefinitions) {
  if (!Array.isArray(toolDefinitions) || toolDefinitions.length === 0) {
    return toolDefinitions;
  }
  const result = [];
  for (const definition of toolDefinitions) {
    if (!definition || !definition.name) {
      result.push(definition);
      continue;
    }
    const description = await getToolDescriptionOverride(definition.name);
    result.push(description != null ? { ...definition, description } : definition);
  }
  return result;
}

/** Clears the file cache (used by tests). */
function clearToolInstructionsCache() {
  fileCache.clear();
}

module.exports = {
  getToolInstruction,
  getToolDescriptionOverride,
  applyToolDescriptionOverrides,
  clearToolInstructionsCache,
};
