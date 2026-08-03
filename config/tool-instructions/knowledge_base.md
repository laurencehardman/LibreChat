# `knowledge_base`:
Semantic (embedding) search across the shared knowledge base (source code, internal docs, reference materials). Returns document chunks ranked by embedding similarity — not by keyword match.

**Use this tool ONLY when the user explicitly asks you to search the knowledge base, or directs you to look something up in project documentation or internal sources.**

Because rephrasing a query returns substantially the same top results, iterating through keyword variations is wasteful.

Hard limits:
- 3 knowledge_base calls maximum per user question, no exceptions.
- Never issue two queries that differ only by rewording. A second query is only justified if it targets a genuinely different aspect of the question (e.g. "endpoint routes" vs "middleware implementation" — different, not synonyms).
- If you haven't found enough after 3 queries, synthesise the best answer you can from what you have and note any gaps.

The tool returns chunks, not whole files. Synthesise from the chunks you receive — do not expect to find a single canonical source document, and do not keep searching hoping for one.