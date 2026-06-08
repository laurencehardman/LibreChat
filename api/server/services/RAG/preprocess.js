const axios = require('axios');
const logger = require('~/utils/logger');
const config = require('./config');

const REFORMULATION_PROMPT = [
    'Rewrite the following user question into a concise, keyword-rich search query',
    'optimised for a hybrid (semantic + keyword) search engine. Include specific',
    'technical terms, function names, and concepts the user is likely asking about.',
    'Keep it under 200 characters.',
    '',
    'User question: {userMessage}',
    '',
    'Search query:',
].join('\n');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Preprocess a user message through the RAG pipeline.
 *
 * @param {string} systemPrompt - The base system prompt (agent instructions).
 * @param {string} userMessage  - The raw user message from the chat.
 * @param {string} [authToken]  - Optional JWT for RAG API authentication.
 * @returns {Promise<string>}
 */
async function enrichSystemPrompt(systemPrompt, userMessage, authToken, projectNames = []) {
    if (!projectNames || projectNames.length === 0) {
        return systemPrompt;
    }

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        return systemPrompt;
    }

    try {
        const refinedQuery = await reformulateQuery(userMessage);
        const chunks = await retrieveChunks(refinedQuery, authToken, projectNames[0]);

        if (!chunks || chunks.length === 0) {
            logger.debug('[RAG] No chunks returned for query', {
                original: userMessage.substring(0, 80),
                refined: refinedQuery.substring(0, 80),
            });
            return systemPrompt;
        }

        return buildEnrichedSystemPrompt(systemPrompt, chunks);
    } catch (err) {
        logger.warn('[RAG] Preprocessing failed, proceeding without enrichment', {
            error: err.message,
            userMessage: userMessage.substring(0, 80),
        });
        return systemPrompt;
    }
}

async function reformulateQuery(userMessage) {
    const url = `${config.reformulationBaseUrl}/v1/chat/completions`;

    const body = {
        model: config.reformulationModel,
        messages: [
            {
                role: 'user',
                content: REFORMULATION_PROMPT.replace('{userMessage}', userMessage),
            },
        ],
        max_tokens: 200,
        temperature: 0.1,
    };

    logger.debug('[RAG] Reformulating query', {
        model: config.reformulationModel,
        inputLength: userMessage.length,
    });

    const response = await axios.post(url, body, {
        headers: {'Content-Type': 'application/json'},
        timeout: config.reformulationTimeout,
    });

    const refined = response.data?.choices?.[0]?.message?.content?.trim();

    if (!refined) {
        logger.warn('[RAG] Reformulation returned empty content, using raw query');
        return userMessage;
    }

    logger.debug('[RAG] Reformulated query', {
        original: userMessage.substring(0, 80),
        refined: refined.substring(0, 80),
    });

    return refined;
}

/**
 * Query the RAG API for relevant document chunks.
 *
 * @param {string} query - The reformulated search query.
 * @param {string} [authToken] - Optional JWT for Authorization header.
 * @returns {Promise<Array<[object, number]>>}
 */
async function retrieveChunks(query, authToken, projectNames = []) {
    const url = `${config.apiUrl}/query_global`;
    const body = {query, k: config.topK};
    if (projectNames.length === 1) {
        body.project_name = projectNames[0];
    }

    logger.debug('[RAG] Retrieving chunks', {
        query: query.substring(0, 80),
        k: config.topK,
        project_name: body.project_name
    });

    const headers = {'Content-Type': 'application/json'};
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await axios.post(url, body, {
        headers,
        timeout: config.retrievalTimeout,
    });

    const data = response.data;
    const results = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];

    if (!Array.isArray(results) || results.length === 0) {
        return [];
    }

    logger.debug('[RAG] Retrieved chunks', {count: results.length});

    return results;
}

function buildEnrichedSystemPrompt(basePrompt, chunks) {
    const refs = [];

    for (const [doc, _score] of chunks) {
        if (!doc || !doc.page_content) {
            continue;
        }

        const source =
            doc.metadata?.file_path ||
            doc.metadata?.project_name ||
            'Unknown';

        refs.push(`Source: ${source}\n${doc.page_content}`);
    }

    if (refs.length === 0) {
        return basePrompt;
    }

    const refsBlock = refs.join('\n\n');

    return [
        basePrompt,
        '',
        '## Reference Documents',
        '',
        refsBlock,
    ].join('\n');
}

module.exports = {enrichSystemPrompt, reformulateQuery, retrieveChunks, buildEnrichedSystemPrompt};