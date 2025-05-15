import { useMemo, useCallback } from 'react';

interface TextMatchResult {
  matchedParagraphIndex: number;
  confidence: number;
}

interface WordMatch {
  word: string;
  weight: number;
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

  // Extract key terms and assign weights
  const getKeyTerms = useCallback((text: string): WordMatch[] => {
    const words = text.toLowerCase().split(/\s+/);
    return words.map(word => ({
      word,
      // Assign higher weights to longer words and potential key terms
      weight: word.length >= 5 ? 2 : 1
    }));
  }, []);

  // Calculate fuzzy match score between two strings
  const getFuzzyMatchScore = useCallback((str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Simple Levenshtein distance implementation
    const matrix = Array(s1.length + 1).fill(null).map(() => 
      Array(s2.length + 1).fill(null)
    );

    for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    // Convert distance to similarity score (0-1)
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (matrix[s1.length][s2.length] / maxLength);
  }, []);

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

    // Get weighted terms from spoken text
    const spokenTerms = getKeyTerms(spokenText);
    console.log("🔍 Matching text:", {
      spoken: spokenText,
      terms: spokenTerms.length
    });

    // Look for matches in each paragraph
    paragraphs.forEach((paragraph, index) => {
      const paragraphTerms = getKeyTerms(paragraph);
      
      let weightedMatches = 0;
      let totalWeight = 0;

      // Check each spoken term against paragraph terms
      spokenTerms.forEach(spokenTerm => {
        // Find best matching term in paragraph
        let bestTermMatch = 0;
        paragraphTerms.forEach(paragraphTerm => {
          const matchScore = getFuzzyMatchScore(spokenTerm.word, paragraphTerm.word);
          if (matchScore > bestTermMatch) {
            bestTermMatch = matchScore;
          }
        });

        weightedMatches += bestTermMatch * spokenTerm.weight;
        totalWeight += spokenTerm.weight;
      });

      // Calculate confidence score with weights
      const confidence = weightedMatches / totalWeight;

      console.log(`📊 Paragraph ${index} match:`, {
        confidence: confidence.toFixed(2),
        sample: paragraph.substring(0, 50)
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
  }, [paragraphs, getKeyTerms, getFuzzyMatchScore]);

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