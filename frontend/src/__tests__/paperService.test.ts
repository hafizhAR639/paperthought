import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient from '@/utils/api';

vi.mock('@/utils/api');

describe('PaperService MVP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('API Response Handling', () => {
    it('should fetch papers for user', async () => {
      const mockPapers = [
        { id: 'paper-1', title: 'Paper 1', status: 'draft' },
        { id: 'paper-2', title: 'Paper 2', status: 'completed' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockPapers },
      });

      const response = await apiClient.get('/papers');
      expect(response.data.data).toEqual(mockPapers);
      expect(response.data.data.length).toBe(2);
    });

    it('should fetch paper details', async () => {
      const mockPaper = {
        id: 'paper-1',
        title: 'Test Paper',
        status: 'analyzing',
        analysisProgress: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockPaper },
      });

      const response = await apiClient.get('/papers/paper-1');
      expect(response.data.data.id).toBe('paper-1');
      expect(response.data.data.title).toBe('Test Paper');
    });

    it('should fetch paragraphs for paper', async () => {
      const mockParagraphs = [
        {
          id: 'para-1',
          originalText: 'Paragraph 1',
          revisedText: null,
          citationScore: 5,
          status: 'pending',
        },
        {
          id: 'para-2',
          originalText: 'Paragraph 2',
          revisedText: 'Revised paragraph 2',
          citationScore: 7,
          status: 'approved',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockParagraphs },
      });

      const response = await apiClient.get('/papers/paper-1/paragraphs');
      expect(response.data.data.length).toBe(2);
      expect(response.data.data[1].revisedText).toBe('Revised paragraph 2');
    });

    it('should fetch analysis results', async () => {
      const mockAnalysis = [
        {
          id: 'analysis-1',
          paragraphId: 'para-1',
          issueType: 'missing_citation',
          severity: 'major',
          description: 'Missing citation',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockAnalysis },
      });

      const response = await apiClient.get('/papers/paper-1/analysis');
      expect(response.data.data.length).toBeGreaterThan(0);
      expect(response.data.data[0].severity).toBe('major');
    });
  });

  describe('Save Revision', () => {
    it('should post revised text to API', async () => {
      const revisedText = 'Updated paragraph text';
      const mockResponse = {
        id: 'para-1',
        revised_text: revisedText,
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockResponse },
      });

      const response = await apiClient.post('/paragraphs/para-1/revise', {
        revised_text: revisedText,
      });

      expect(response.data.data.id).toBe('para-1');
      expect(response.data.data.revised_text).toBe(revisedText);
    });

    it('should include revised_text in request body', async () => {
      const revisedText = 'New paragraph content';
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true },
      });

      await apiClient.post('/paragraphs/para-1/revise', {
        revised_text: revisedText,
      });

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/paragraphs/para-1/revise',
        expect.objectContaining({
          revised_text: revisedText,
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(apiClient.get('/papers')).rejects.toThrow('Network error');
    });

    it('should handle 404 Not Found', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 404, data: { error: 'Paper not found' } },
      });

      await expect(apiClient.get('/papers/invalid-id')).rejects.toThrow();
    });

    it('should handle 401 Unauthorized', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 401, data: { error: 'Unauthorized' } },
      });

      await expect(apiClient.get('/papers')).rejects.toThrow();
    });
  });
});
