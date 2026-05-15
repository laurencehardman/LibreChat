const axios = require('axios');
const { generateShortLivedToken } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');

let initialized = false;

async function initializeKnowledgeBase() {
    if (initialized) {
        return;
    }

    const jwtToken = generateShortLivedToken('system');
    if (!jwtToken) {
        logger.warn('Failed to generate JWT for knowledge base initialization');
        return;
    }

    try {
        const response = await axios.get(`${process.env.RAG_API_URL}/projects`, {
            timeout: 5000,
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                'Content-Type': 'application/json',
            },
        });
        const projects = Array.isArray(response.data)
            ? response.data.map((p) => p.name)
            : [];

        if (projects.length) {
            const { setKnowledgeBaseProjects } = require('@librechat/api');
            setKnowledgeBaseProjects(projects);
            initialized = true;
            logger.info(`Knowledge base initialized with projects: ${projects.join(', ')}`);
        } else {
            logger.warn('Knowledge base /projects returned no projects');
        }
    } catch (error) {
        logger.warn('Failed to initialize knowledge base projects:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
        });
    }
}

module.exports = initializeKnowledgeBase;