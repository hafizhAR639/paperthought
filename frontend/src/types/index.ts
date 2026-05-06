export interface User {
  id: string;
  email: string;
  fullName: string;
  institution?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Paper {
  id: string;
  userId: string;
  title: string;
  originalContent: string;
  currentVersionId: string;
  status: 'draft' | 'analyzing' | 'revision' | 'completed';
  analysisProgress?: number;
  analysisMessage?: string | null;
  analysisTotalParagraphs?: number;
  analysisProcessedParagraphs?: number;
  analysisStartedAt?: string | Date | null;
  analysisCompletedAt?: string | Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaperVersion {
  id: string;
  paperId: string;
  versionNumber: number;
  content: string;
  overallScore: number;
  createdAt: Date;
}

export interface Paragraph {
  id: string;
  versionId: string;
  paragraphOrder: number;
  originalText: string;
  revisedText?: string;
  citationScore: number;
  coherenceScore: number;
  alignmentScore: number;
  researchGapScore: number;
  status: 'pending' | 'needs_revision' | 'approved';
  createdAt: Date;
}

export interface AnalysisResult {
  id: string;
  paragraphId: string;
  issueType: 'missing_citation' | 'weak_coherence' | 'misalignment' | 'underdeveloped';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  suggestedAction: string;
  startIndex: number;
  endIndex: number;
  createdAt: Date;
}

export interface ReferencePaper {
  id: string;
  userId: string;
  title: string;
  authors: string[];
  year: number;
  filePath: string;
  extractedContent: string;
  createdAt: Date;
}

export interface ReferenceFindings {
  id: string;
  referenceId: string;
  findingType: 'theory' | 'methodology' | 'result' | 'argument';
  content: string;
  pageNumber?: number;
  embedding?: number[];
  createdAt: Date;
}

export interface Suggestion {
  id: string;
  paragraphId: string;
  findingId: string;
  relevanceScore: number;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
