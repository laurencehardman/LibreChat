const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getToolInstruction,
  getToolDescriptionOverride,
  applyToolDescriptionOverrides,
  clearToolInstructionsCache,
} = require('./toolInstructions');

describe('toolInstructions', () => {
  let overrideDir;
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.TOOL_INSTRUCTIONS_DIR;
    overrideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-instructions-'));
    process.env.TOOL_INSTRUCTIONS_DIR = overrideDir;
  });

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.TOOL_INSTRUCTIONS_DIR;
    } else {
      process.env.TOOL_INSTRUCTIONS_DIR = originalEnv;
    }
    fs.rmSync(overrideDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    clearToolInstructionsCache();
    for (const file of fs.readdirSync(overrideDir)) {
      fs.rmSync(path.join(overrideDir, file));
    }
  });

  describe('getToolInstruction', () => {
    it('returns null when no override file exists', async () => {
      await expect(getToolInstruction('some_tool')).resolves.toBeNull();
    });

    it('returns content from a .md file', async () => {
      fs.writeFileSync(path.join(overrideDir, 'knowledge_base.md'), 'custom KB instructions');
      await expect(getToolInstruction('knowledge_base')).resolves.toBe('custom KB instructions');
    });

    it('supports the .txt extension', async () => {
      fs.writeFileSync(path.join(overrideDir, 'web_search.txt'), 'custom web instructions');
      await expect(getToolInstruction('web_search')).resolves.toBe('custom web instructions');
    });

    it('treats empty or whitespace-only files as null (absent)', async () => {
      fs.writeFileSync(path.join(overrideDir, 'knowledge_base.md'), '   \n');
      await expect(getToolInstruction('knowledge_base')).resolves.toBeNull();
    });

    it('picks up file edits without a restart (mtime invalidation)', async () => {
      const filePath = path.join(overrideDir, 'some_tool.md');
      fs.writeFileSync(filePath, 'version one');
      await expect(getToolInstruction('some_tool')).resolves.toBe('version one');

      fs.writeFileSync(filePath, 'version two');
      const future = new Date(Date.now() + 5000);
      fs.utimesSync(filePath, future, future);
      await expect(getToolInstruction('some_tool')).resolves.toBe('version two');
    });

    it('returns null after the file is removed', async () => {
      const filePath = path.join(overrideDir, 'some_tool.md');
      fs.writeFileSync(filePath, 'override');
      await expect(getToolInstruction('some_tool')).resolves.toBe('override');

      fs.rmSync(filePath);
      await expect(getToolInstruction('some_tool')).resolves.toBeNull();
    });
  });

  describe('description overrides', () => {
    it('returns null when no description override exists', async () => {
      await expect(getToolDescriptionOverride('knowledge_base')).resolves.toBeNull();
    });

    it('reads <tool>.description.md files', async () => {
      fs.writeFileSync(
        path.join(overrideDir, 'knowledge_base.description.md'),
        'custom description',
      );
      await expect(getToolDescriptionOverride('knowledge_base')).resolves.toBe(
        'custom description',
      );
    });

    it('patches only matching definitions', async () => {
      fs.writeFileSync(path.join(overrideDir, 'knowledge_base.description.md'), 'new KB desc');
      const definitions = [
        { name: 'knowledge_base', description: 'old KB desc', parameters: { type: 'object' } },
        { name: 'google', description: 'search engine' },
      ];
      const patched = await applyToolDescriptionOverrides(definitions);
      expect(patched[0].description).toBe('new KB desc');
      expect(patched[0].parameters).toEqual({ type: 'object' });
      expect(patched[1]).toBe(definitions[1]);
    });

    it('returns the input untouched when empty or invalid', async () => {
      await expect(applyToolDescriptionOverrides([])).resolves.toEqual([]);
      await expect(applyToolDescriptionOverrides(undefined)).resolves.toBeUndefined();
    });
  });
});
