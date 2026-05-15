// api/server/routes/knowledge.js (new file)

const axios = require('axios');
const jwt = require('jsonwebtoken');


async function getKnowledgeProjects(req, res) {
    try {
        const jwtToken = jwt.sign(
            { id: req.user?.id },
            process.env.JWT_SECRET,
            { expiresIn: '60s' },
        );

        const response = await axios.get(`${process.env.RAG_API_URL}/projects`, {
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                'Content-Type': 'application/json',
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('[getKnowledgeProjects]', error.response?.status, error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch knowledge base projects' });
    }
}

module.exports = { getKnowledgeProjects };
