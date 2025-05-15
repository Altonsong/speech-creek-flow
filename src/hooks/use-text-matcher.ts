import { useMemo } from 'react';

interface TextMatchResult {
  matchedParagraphIndex: number;
  confidence: number;
}

export function useTextMatcher(script: string) {
  // Split script into paragraphs and memoize to avoid unnecessary recalculations
  const paragraphs = useMemo(() => {
    return script.split('\n').filter(p => p.trim().length > 0);
  }, [script]);

  // Find the best matching paragraph for the spoken text
  const findMatchingParagraph = (spokenText: string): TextMatchResult => {
    if (!spokenText || paragraphs.length === 0) {
      return { matchedParagraphIndex: 0, confidence: 0 };
    }

    let bestMatchIndex = 0;
    let highestConfidence = 0;

    // Convert spoken text to lowercase for case-insensitive matching
    const normalizedSpokenText = spokenText.toLowerCase();
    const spokenWords = normalizedSpokenText.split(' ');

    // Compare spoken text against each paragraph
    paragraphs.forEach((paragraph, index) => {
      const normalizedParagraph = paragraph.toLowerCase();
      const paragraphWords = normalizedParagraph.split(' ');
      
      // Calculate matching words
      const matchingWords = spokenWords.filter(word => 
        paragraphWords.includes(word)
      ).length;
      
      // Calculate confidence score (0-1)
      const confidence = matchingWords / Math.max(spokenWords.length, paragraphWords.length);
      
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatchIndex = index;
      }
    });

    return {
      matchedParagraphIndex: bestMatchIndex,
      confidence: highestConfidence
    };
  };

  // Calculate the scroll position for a given paragraph
  const getParagraphPosition = (paragraphIndex: number): number => {
    if (paragraphIndex < 0 || paragraphIndex >= paragraphs.length) {
      return 0;
    }

    // Calculate approximate position based on character count
    const charactersBeforeParagraph = paragraphs
      .slice(0, paragraphIndex)
      .reduce((sum, p) => sum + p.length + 1, 0); // +1 for newline

    // Estimate scroll position (assuming average character height)
    const averageCharacterHeight = 30; // Approximate pixels per line
    return charactersBeforeParagraph * (averageCharacterHeight / 50); // Adjust for reasonable scrolling
  };

  return {
    findMatchingParagraph,
    getParagraphPosition
  };
}