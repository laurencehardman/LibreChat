const axios = require('axios');

jest.mock('axios');

describe('RAG preprocess', () => {
  let preprocess;

  beforeAll(() => {
    process.env.RAG_API_URL = 'http://rag.test';
    preprocess = require('../preprocess');
  });

  describe('retrieveChunks', () => {
    it('sends project_name as an array when multiple projects are selected', async () => {
      axios.post.mockResolvedValue({
        data: [[{ page_content: 'chunk', metadata: {} }, 0.9]],
      });

      const result = await preprocess.retrieveChunks('query', 'token', ['alpha', 'beta']);

      expect(axios.post).toHaveBeenCalledWith(
        'http://rag.test/query_global',
        { query: 'query', k: 5, project_name: ['alpha', 'beta'] },
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('sends a single-element array when one project is selected', async () => {
      axios.post.mockResolvedValue({ data: [] });

      await preprocess.retrieveChunks('query', 'token', ['alpha']);

      expect(axios.post.mock.calls[0][1].project_name).toEqual(['alpha']);
    });

    it('omits project_name when no projects are selected', async () => {
      axios.post.mockResolvedValue({ data: [] });

      await preprocess.retrieveChunks('query', undefined, []);

      const body = axios.post.mock.calls[0][1];
      expect(body).toEqual({ query: 'query', k: 5 });
      expect(body.project_name).toBeUndefined();
    });
  });

  describe('enrichSystemPrompt', () => {
    it('returns the base prompt untouched when no projects are selected', async () => {
      const result = await preprocess.enrichSystemPrompt('base', 'hello', 'token', []);

      expect(result).toBe('base');
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('scopes the RAG request by the selected projects', async () => {
      axios.post
        .mockResolvedValueOnce({
          data: { choices: [{ message: { content: 'refined query' } }] },
        })
        .mockResolvedValueOnce({
          data: [[{ page_content: 'chunk text', metadata: { file_path: 'src/a.js' } }, 0.9]],
        });

      const result = await preprocess.enrichSystemPrompt(
        'base prompt',
        'how does X work?',
        'token',
        ['alpha', 'beta'],
      );

      expect(result).toContain('base prompt');
      expect(result).toContain('chunk text');
      expect(result).toContain('src/a.js');

      const ragCall = axios.post.mock.calls.find(([url]) => url.endsWith('/query_global'));
      expect(ragCall[1].project_name).toEqual(['alpha', 'beta']);
    });
  });
});
