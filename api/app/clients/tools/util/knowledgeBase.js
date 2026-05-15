const axios = require('axios');
const { logger } = require('@librechat/data-schemas');
const { tool } = require('@librechat/agents/langchain/tools');
const { generateShortLivedToken } = require('@librechat/api');
const { Tools } = require('librechat-data-provider');

const STATIC_SOURCE_TYPES = ['source_code', 'documentation'];

const knowledgeBaseJsonSchema = {
    type: 'object',
    properties: {
        query: {
            type: 'string',
            description:
                'Search query matched by embedding similarity against document chunks. Use short, precise terms likely to appear in source code — function names, component names, file paths, string literals. 2-4 words outperforms long descriptive sentences.',
        },
        project_name: {
            type: 'string',
            description:
                'Optional. Restrict search to a specific project. Use when the user explicitly names a project or when previous context makes it clear which project is relevant.',
        },
        source_type: {
            type: 'string',
            enum: STATIC_SOURCE_TYPES,
            description:
                'Optional. Restrict search by source type. Use "source_code" for code repositories or "documentation" for docs and reference materials.',
        },
    },
    required: ['query'],
};



async function fetchAvailableProjects(userId) {
    const jwtToken = generateShortLivedToken(userId);
    if (!jwtToken) {
        return [];
    }
    try {
        const response = await axios.get(`${process.env.RAG_API_URL}/projects`, {
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                'Content-Type': 'application/json',
            },
        });
        const projects = Array.isArray(response.data)
            ? response.data.map((p) => p.name)
            : response.data?.projects?.map((p) => p.name) ?? [];
        return projects;
    } catch (error) {
        // ... same error handling
        return [];
    }
}



const createKnowledgeBaseTool = async ({ userId }) => {
    const schema = JSON.parse(JSON.stringify(knowledgeBaseJsonSchema));

    const projects = await fetchAvailableProjects(userId);
    if (projects.length) {
        schema.properties.project_name.enum = projects;
    }

    return tool(
        async ({ query, project_name, source_type }) => {
            const jwtToken = generateShortLivedToken(userId);
            if (!jwtToken) {
                return ['There was an error authenticating the knowledge search request.', undefined];
            }

            try {
                const requestBody = { query, k: 5 };
                if (project_name) {
                    requestBody.project_name = project_name;
                }
                if (source_type) {
                    requestBody.source_type = source_type;
                }

                const response = await axios.post(
                    `${process.env.RAG_API_URL}/query_global`,
                    requestBody,
                    {
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

                if (!response.data || response.data.length === 0) {
                    return ['No relevant knowledge found for your query.', undefined];
                }

                const logitToPct = (score) => (1 / (1 + Math.exp(-score))) * 100;

                const formatted = response.data
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(
                        ([doc, score]) =>
                            `Source: ${doc.metadata.file_path || 'unknown'}\nRelevance: ${logitToPct(score).toFixed(1)}\nContent: ${doc.page_content}\n`,
                    )
                    .join('\n---\n');

                return [formatted, undefined];
            } catch (error) {
                logger.error('Error in knowledge_base:', error);
                return ['An error occurred while searching the knowledge base.', undefined];
            }
        },
        {
            name: Tools.knowledge_base,
            responseFormat: 'content_and_artifact',
            description:
                'Performs semantic (embedding) search across the shared knowledge base (source code, internal docs, reference materials). Returns document chunks ranked by embedding similarity, not by keyword match.\n\n'
                + 'CRITICAL USAGE RULES:\n'
                + '- Fire ALL queries in a single batch at the start of your response. Do not search, think, then search again. One batch, then stop calling this tool.\n'
                + '- 3 queries maximum TOTAL for the entire turn. Not 3 per round. Not 3 per topic. Three calls across all rounds combined.\n'
                + '- Rephrasing the same question returns near-identical top-ranked chunks. Vary queries by ASPECT (e.g. "frontend toggle component" vs "backend auth middleware"), never by rewording the same question.\n'
                + '- The tool returns short snippets, not full files. You will never see the complete source of a file. Synthesise from the chunks in your single batch — do not hunt for a canonical source file or a "better" version.\n'
                + '- After your batch of queries returns, answer immediately. Do not search again.',
            schema,
        },
    );
};

module.exports = { createKnowledgeBaseTool, knowledgeBaseJsonSchema };