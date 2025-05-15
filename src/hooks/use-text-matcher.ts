import { useMemo, useCallback } from 'react';

interface TextMatchResult {
  matchedParagraphIndex: number;
  confidence: number;
}

export function useTextMatcher(fullText: string) {
  // Split text into paragraphs and create searchable content
  const paragraphs = useMemo(() => {
    const parts = fullText
      .split(/\n\s*\n/) // Split on empty lines
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    console.log("📑 Parsed paragraphs:", parts.length);
    return parts;
  }, [fullText]);

  // Find best matching paragraph for spoken text
  const findMatchingParagraph = useCallback((spokenText: string): TextMatchResult => {
    if (!spokenText || paragraphs.length === 0) {
      console.log("⚠️ No text to match");
      return { matchedParagraphIndex: 0, confidence: 0 };
    }

    let bestMatch = {
      index: 0,
      confidence: 0
    };

    // Clean up spoken text for comparison
    const cleanSpokenText = spokenText.toLowerCase().trim();
    const spokenWords = new Set(cleanSpokenText.split(/\s+/));

    console.log("🔍 Matching text:", {
      spoken: cleanSpokenText,
      wordCount: spokenWords.size
    });

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

      console.log(`📊 Paragraph ${index} match:`, {
        matchingWords,
        totalWords: paragraphWords.size,
        confidence: confidence.toFixed(2)
      });

      // Update best match if this is better
      if (confidence > bestMatch.confidence) {
        bestMatch = { index, confidence };
      }
    });

    console.log("✅ Best match:", {
      paragraphIndex: bestMatch.index,
      confidence: bestMatch.confidence.toFixed(2)
    });

    return {
      matchedParagraphIndex: bestMatch.index,
      confidence: bestMatch.confidence
    };
  }, [paragraphs]);

  // Get paragraph position in text
  const getParagraphPosition = useCallback((index: number): number => {
    if (index < 0 || index >= paragraphs.length) {
      console.log("⚠️ Invalid paragraph index:", index);
      return 0;
    }

    // Calculate offset to the start of the target paragraph
    let position = 0;
    for (let i = 0; i < index; i++) {
      position += paragraphs[i].length + 2; // +2 for paragraph breaks
    }

    console.log("📍 Paragraph position:", {
      index,
      position,
      content: paragraphs[index].substring(0, 50) + "..."
    });

    return position;
  }, [paragraphs]);

  return {
    findMatchingParagraph,
    getParagraphPosition,
    paragraphs
  };
}