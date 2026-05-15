import { Tools } from 'librechat-data-provider';

export function buildKnowledgeBaseContext(): string {
    return `# \`${Tools.knowledge_base}\`:
Semantic search across the shared knowledge base (source code, internal docs, reference materials). Returns document chunks ranked by embedding similarity — not by keyword match.

**Use this tool ONLY when the user explicitly asks you to search the knowledge base.**

Because rephrased queries return substantially the same top-ranked chunks, do NOT iterate through keyword variations. Issue at most 3 queries targeting genuinely different aspects. Synthesise your answer from the chunks received — do not hunt for a canonical source file or keep searching hoping for a perfect match.

**No citation anchors needed** — reference source files inline where helpful (e.g. "In \`config.py\`, the \`LogMiddleware\` class...").`.trim();
}
