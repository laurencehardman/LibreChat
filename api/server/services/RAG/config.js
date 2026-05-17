/**
 * RAG preprocessing configuration.
 *
 * Reads from environment variables with sensible defaults.
 * All config is loaded once at require() time (module caching).
 */

const config = {
    /** Whether RAG enrichment is enabled */
    enabled: process.env.RAG_ENABLED === 'true',

    /** Base URL of the RAG API (e.g. http://rag-api:8000) */
    apiUrl: process.env.RAG_API_URL || 'http://rag-api:8000',

    /** Number of chunks to retrieve per query */
    topK: parseInt(process.env.RAG_TOP_K, 10) || 5,

    /** Model identifier for query reformulation (passed to LiteLLM) */
    reformulationModel: process.env.RAG_REFORMULATION_MODEL || 'LekkerGPT Micro',

    /** LiteLLM base URL for chat completions */
    reformulationBaseUrl:
        process.env.RAG_REFORMULATION_BASE_URL || 'http://litellm:4000',

    /** Timeout for reformulation LLM call (ms) */
    reformulationTimeout: parseInt(process.env.RAG_REFORMULATION_TIMEOUT, 10) || 15000,

    /** Timeout for RAG API call (ms) */
    retrievalTimeout: parseInt(process.env.RAG_RETRIEVAL_TIMEOUT, 10) || 30000,
};

module.exports = config;