import { create } from 'zustand';
import { Paper, Paragraph, AnalysisResult } from '../types';

interface PaperStoreState {
  papers: Paper[];
  currentPaper: Paper | null;
  paragraphs: Paragraph[];
  analysisResults: AnalysisResult[];
  
  setCurrentPaper: (paper: Paper) => void;
  setPapers: (papers: Paper[]) => void;
  setParagraphs: (paragraphs: Paragraph[]) => void;
  setAnalysisResults: (results: AnalysisResult[]) => void;
  updateParagraph: (paragraphId: string, updates: Partial<Paragraph>) => void;
  clearCurrent: () => void;
}

export const usePaperStore = create<PaperStoreState>((set) => ({
  papers: [],
  currentPaper: null,
  paragraphs: [],
  analysisResults: [],

  setCurrentPaper: (paper) => set({ currentPaper: paper }),
  setPapers: (papers) => set({ papers }),
  setParagraphs: (paragraphs) => set({ paragraphs }),
  setAnalysisResults: (results) => set({ analysisResults: results }),

  updateParagraph: (paragraphId, updates) =>
    set((state) => ({
      paragraphs: state.paragraphs.map((p) =>
        p.id === paragraphId ? { ...p, ...updates } : p,
      ),
    })),

  clearCurrent: () => set({ currentPaper: null, paragraphs: [], analysisResults: [] }),
}));
