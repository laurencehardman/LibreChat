import fs from 'fs';
import os from 'os';
import path from 'path';
import { clearServerInstructionCache, getServerInstructionFile } from './instructions';

describe('getServerInstructionFile', () => {
  let dir: string;
  const originalEnv = process.env.MCP_INSTRUCTIONS_DIR;

  beforeEach(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mcp-instructions-'));
    process.env.MCP_INSTRUCTIONS_DIR = dir;
    clearServerInstructionCache();
  });

  afterEach(async () => {
    if (originalEnv === undefined) {
      delete process.env.MCP_INSTRUCTIONS_DIR;
    } else {
      process.env.MCP_INSTRUCTIONS_DIR = originalEnv;
    }
    clearServerInstructionCache();
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it('reads and trims <serverName>.md content', async () => {
    await fs.promises.writeFile(path.join(dir, 'github.md'), '  Use GitHub with care\n\n');
    await expect(getServerInstructionFile('github')).resolves.toBe('Use GitHub with care');
  });

  it('falls back to .txt when no .md exists', async () => {
    await fs.promises.writeFile(path.join(dir, 'github.txt'), 'txt instructions');
    await expect(getServerInstructionFile('github')).resolves.toBe('txt instructions');
  });

  it('prefers .md over .txt', async () => {
    await fs.promises.writeFile(path.join(dir, 'github.md'), 'md instructions');
    await fs.promises.writeFile(path.join(dir, 'github.txt'), 'txt instructions');
    await expect(getServerInstructionFile('github')).resolves.toBe('md instructions');
  });

  it('returns null for missing or empty files', async () => {
    await expect(getServerInstructionFile('missing')).resolves.toBeNull();
    await fs.promises.writeFile(path.join(dir, 'empty.md'), '   \n');
    await expect(getServerInstructionFile('empty')).resolves.toBeNull();
  });

  it('serves cached content while mtime is unchanged and re-reads when it changes', async () => {
    const filePath = path.join(dir, 'github.md');
    const fixed = new Date(Math.floor(Date.now() / 1000) * 1000);
    await fs.promises.writeFile(filePath, 'first');
    await fs.promises.utimes(filePath, fixed, fixed);
    await expect(getServerInstructionFile('github')).resolves.toBe('first');

    await fs.promises.writeFile(filePath, 'second');
    await fs.promises.utimes(filePath, fixed, fixed);
    await expect(getServerInstructionFile('github')).resolves.toBe('first');

    const future = new Date(fixed.getTime() + 5000);
    await fs.promises.utimes(filePath, future, future);
    await expect(getServerInstructionFile('github')).resolves.toBe('second');
  });
});
