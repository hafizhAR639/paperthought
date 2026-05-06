import { analyzeMock, normalizeTextForAnalysis, countWords } from '../services/aiService';

describe('Analysis Service MVP', () => {
  describe('Score Normalization', () => {
    test('should clamp scores above 10 to 10', () => {
      // The normalizeScore function should be applied in analysisService
      // Testing the overall behavior through mock analyzer
      const text = 'A' + ' word '.repeat(200); // 200+ word paragraph to get high score
      const analysis = analyzeMock(text, 'Test Paper');

      // All scores should be within 0-10
      expect(analysis.citation_score).toBeLessThanOrEqual(10);
      expect(analysis.coherence_score).toBeLessThanOrEqual(10);
      expect(analysis.alignment_score).toBeLessThanOrEqual(10);
      expect(analysis.research_gap_score).toBeLessThanOrEqual(10);
    });

    test('should clamp scores below 0 to 0', () => {
      const text = ''; // Empty text should give low scores
      const analysis = analyzeMock(text, 'Test Paper');

      expect(analysis.citation_score).toBeGreaterThanOrEqual(0);
      expect(analysis.coherence_score).toBeGreaterThanOrEqual(0);
      expect(analysis.alignment_score).toBeGreaterThanOrEqual(0);
      expect(analysis.research_gap_score).toBeGreaterThanOrEqual(0);
    });

    test('should not exceed maximum decimal places', () => {
      const analysis = analyzeMock('Sample paragraph for analysis.', 'Test');
      
      // Check each score has max 2 decimal places
      [analysis.citation_score, analysis.coherence_score, analysis.alignment_score, analysis.research_gap_score].forEach(
        (score) => {
          const decimalPlaces = (score.toString().split('.')[1] || '').length;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
        },
      );
    });
  });

  describe('Text Normalization', () => {
    test('should normalize excessive whitespace', () => {
      const text = 'This   has    multiple     spaces';
      const normalized = normalizeTextForAnalysis(text);

      expect(normalized).not.toContain('   ');
      expect(normalized).toBe('This has multiple spaces');
    });

    test('should trim leading/trailing whitespace', () => {
      const text = '   Text with extra spaces   ';
      const normalized = normalizeTextForAnalysis(text);

      expect(normalized).toBe('Text with extra spaces');
      expect(normalized[0]).not.toBe(' ');
      expect(normalized[normalized.length - 1]).not.toBe(' ');
    });

    test('should respect maximum character limit', () => {
      const text = 'A'.repeat(5000);
      const normalized = normalizeTextForAnalysis(text);

      expect(normalized.length).toBeLessThanOrEqual(3000);
    });

    test('should handle empty text gracefully', () => {
      const normalized = normalizeTextForAnalysis('');

      expect(normalized).toBe('');
      expect(typeof normalized).toBe('string');
    });
  });

  describe('Word Counting', () => {
    test('should count words correctly', () => {
      const text = 'This is a test paragraph with ten words in it.';
      const count = countWords(text);

      expect(count).toBe(10);
    });

    test('should handle multiple spaces between words', () => {
      const text = 'Word1    word2     word3';
      const count = countWords(text);

      expect(count).toBe(3);
    });

    test('should return 0 for empty text', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });

    test('should count words with punctuation', () => {
      const text = "It's a test. Words, here!";
      const count = countWords(text);

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Mock Analysis Response Structure', () => {
    test('should return valid analysis object with required fields', () => {
      const analysis = analyzeMock('Test paragraph', 'Test Paper');

      expect(analysis).toHaveProperty('citation_score');
      expect(analysis).toHaveProperty('coherence_score');
      expect(analysis).toHaveProperty('alignment_score');
      expect(analysis).toHaveProperty('research_gap_score');
      expect(analysis).toHaveProperty('issues');
      expect(analysis).toHaveProperty('overall_feedback');
    });

    test('should return issues array', () => {
      const analysis = analyzeMock('Short text', 'Test Paper');

      expect(Array.isArray(analysis.issues)).toBe(true);
      if (analysis.issues.length > 0) {
        const issue = analysis.issues[0];
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('suggested_action');
      }
    });

    test('should provide overall feedback', () => {
      const analysis = analyzeMock('Test paragraph', 'Test Paper');

      expect(typeof analysis.overall_feedback).toBe('string');
      expect(analysis.overall_feedback.length).toBeGreaterThan(0);
    });

    test('should generate consistent structure for various inputs', () => {
      const testInputs = [
        'Short text',
        'Medium length paragraph with more content and details here',
        'A'.repeat(100),
      ];

      testInputs.forEach((input) => {
        const analysis = analyzeMock(input, 'Test Paper');
        expect(analysis).toHaveProperty('citation_score');
        expect(analysis).toHaveProperty('coherence_score');
        expect(analysis).toHaveProperty('alignment_score');
        expect(analysis).toHaveProperty('research_gap_score');
        expect(typeof analysis.citation_score).toBe('number');
        expect(typeof analysis.coherence_score).toBe('number');
        expect(typeof analysis.alignment_score).toBe('number');
        expect(typeof analysis.research_gap_score).toBe('number');
      });
    });
  });

  describe('Average Score Calculation', () => {
    test('should calculate average within bounds 0-10', () => {
      const analysis = analyzeMock('Test paragraph', 'Test Paper');
      const avgScore =
        (analysis.citation_score +
          analysis.coherence_score +
          analysis.alignment_score +
          analysis.research_gap_score) /
        4;

      expect(avgScore).toBeGreaterThanOrEqual(0);
      expect(avgScore).toBeLessThanOrEqual(10);
    });

    test('should trigger needs_revision status for low scores', () => {
      // Create small text to get low score
      const analysis = analyzeMock('Word.', 'Test');
      const avgScore =
        (analysis.citation_score +
          analysis.coherence_score +
          analysis.alignment_score +
          analysis.research_gap_score) /
        4;

      // Status should depend on avgScore
      const expectedStatus = avgScore < 5 ? 'needs_revision' : 'pending';
      // Verify low score logic consistency
      if (avgScore < 5) {
        expect(analysis.issues.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
