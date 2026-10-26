import fs from 'fs';
import path from 'path';
import { logger } from '@librechat/data-schemas';

/**
 * File-based instruction overrides for MCP servers.
 *
 * Instruction files are plain Markdown loaded from `MCP_INSTRUCTIONS_DIR`
 * (default: `<cwd>/config/mcp-instructions`, i.e. `/app/config/mcp-instructions`
 * in the Docker image — bind-mount it to edit instructions without rebuilding):
 *
 *   <serverName>.md → instructions injected into the system prompt whenever
 *                     that server's tools are selected for a run. Takes
 *                     precedence over the `serverInstructions` config value.
 *
 * `.txt` is accepted as an alternative extension. Files are re-read when their
 * modification time changes, so edits apply to new runs without a restart.
 */

const EXTENSIONS = ['.md', '.txt'];

interface CacheEntry {
  mtimeMs: number;
  content: string;
}

/** filePath → { mtimeMs, content } cache; entries are invalidated by mtime changes. */
const fileCache = new Map<string, CacheEntry>();

function getInstructionsDir(): string {
  return (
    process.env.MCP_INSTRUCTIONS_DIR || path.resolve(process.cwd(), 'config', 'mcp-instructions')
  );
}

/**
 * Reads the instruction file for an MCP server, revalidating against mtime.
 * @param serverName - Raw config name of the MCP server (e.g. `github`).
 * @returns Trimmed file content, or null when no file exists / the file is empty.
 */
export async function getServerInstructionFile(serverName: string): Promise<string | null> {
  const dir = getInstructionsDir();
  for (const ext of EXTENSIONS) {
    const filePath = path.join(dir, `${serverName}${ext}`);
    let stat: fs.Stats;
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
      logger.warn(`[mcpInstructions] Failed to read "${filePath}":`, error);
      return null;
    }
  }
  return null;
}

/** Clears the file cache (used by tests). */
export function clearServerInstructionCache(): void {
  fileCache.clear();
}
