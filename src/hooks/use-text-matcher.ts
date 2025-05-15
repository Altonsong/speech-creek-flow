import { useMemo, useCallback } from 'react';

interface TextMatchResult {
  matchedParagraphIndex: number;
  confidence: number;
}

export function useTextMatcher(fullText: string) {
  // Split text into paragraphs and create searchable content
  const paragraphs = useMemo(() => {
    return fullText
      .split(/\n\s*\n/) // Split on empty lines
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }, [fullText]);

  // Find best matching paragraph for spoken text
  const findMatchingParagraph = useCallback((spokenText: string): TextMatchResult => {
    if (!spokenText || paragraphs.length === 0) {
      return { matchedParagraphIndex: 0, confidence: 0 };
    }

    let bestMatch = {
      index: 0,
      confidence: 0
    };

    // Clean up spoken text for comparison
    const cleanSpokenText = spokenText.toLowerCase().trim();
    const spokenWords = new Set(cleanSpokenText.split(/\s+/));

    // Look for matches in each paragraph
    paragraphs.forEach((paragraph, index) => {
      const cleanParagraph = paragraph.toLowerCase();
      const paragraphWords = new Set(cleanParagraph.split(/\s+/));

      // Count matching words
      let matchingWords = 0;
      spokenWords.forEach(word => {
        if (paragraphWords.has(word)) {
          matchingWords++;
        }
      });

      // Calculate confidence score
      const confidence = matchingWords / Math.max(spokenWords.size, paragraphWords.size);

      // Update best match if this is better
      if (confidence > bestMatch.confidence) {
        bestMatch = { index, confidence };
      }
    });

    return {
      matchedParagraphIndex: bestMatch.index,
      confidence: bestMatch.confidence
    };
  }, [paragraphs]);

  // Get paragraph position in text
  const getParagraphPosition = useCallback((index: number): number => {
    if (index < 0 || index >= paragraphs.length) {
      return 0;
    }

    // Calculate offset to the start of the target paragraph
    let position = 0;
    for (let i = 0; i < index; i++) {
      position += paragraphs[i].length + 2; // +2 for paragraph breaks
    }
    return position;
  }, [paragraphs]);

  return {
    findMatchingParagraph,
    getParagraphPosition,
    paragraphs
  };
}