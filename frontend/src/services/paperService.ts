// Frontend service stub for calling papers API
import apiClient from '../utils/api';
import type { Paper, Paragraph, AnalysisResult } from '../types';

export const paperService = {
  // Upload a new paper
  async uploadPaper(title: string, content: string): Promise<any> {
    const response = await apiClient.post('/papers/upload', { title, content });
    return response.data.data;
  },

  // Get all user papers
  async getPapers(): Promise<Paper[]> {
    const response = await apiClient.get('/papers');
    return response.data.data || [];
  },

  // Get paper details
  async getPaper(paperId: string): Promise<Paper> {
    const response = await apiClient.get(`/papers/${paperId}`);
    return response.data.data;
  },

  // Trigger analysis
  async analyzePaper(paperId: string): Promise<any> {
    const response = await apiClient.post(`/papers/${paperId}/analyze`);
    return response.data.data;
  },

  // Get paragraphs for a paper
  async getParagraphs(paperId: string): Promise<Paragraph[]> {
    const response = await apiClient.get(`/papers/${paperId}/paragraphs`);
    return response.data.data || [];
  },

  // Get analysis results
  async getAnalysis(paperId: string): Promise<AnalysisResult[]> {
    const response = await apiClient.get(`/papers/${paperId}/analysis`);
    return response.data.data || [];
  },

  // Submit paragraph revision
  async reviseParent(paragraphId: string, revisedText: string): Promise<any> {
    const response = await apiClient.post(`/paragraphs/${paragraphId}/revise`, {
      revised_text: revisedText,
    });
    return response.data.data;
  },
};
