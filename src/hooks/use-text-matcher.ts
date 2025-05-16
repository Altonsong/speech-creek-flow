import { useMemo } from 'react';

interface TextMatchResult {
  matchedParagraphIndex: number;
  confidence: number;
}

export function useTextMatcher(script: string) {
  const paragraphs = useMemo(() => {
    return script.split('\n').filter(p => p.trim().length > 0);
  }, [script]);

  const findMatchingParagraph = (spokenText: string): TextMatchResult => {
    if (!spokenText || paragraphs.length === 0) {
      return { matchedParagraphIndex: 0, confidence: 0 };
    }

    let bestMatchIndex = 0;
    let highestConfidence = 0;

    const normalizedSpokenText = spokenText.toLowerCase();
    // 提取更多有意义的词进行匹配
    const spokenWords = normalizedSpokenText.split(' ')
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'was', 'were', 'that', 'this', 'they', 'with'].includes(word));

    paragraphs.forEach((paragraph, index) => {
      const normalizedParagraph = paragraph.toLowerCase();
      const paragraphWords = normalizedParagraph.split(' ')
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'was', 'were', 'that', 'this', 'they', 'with'].includes(word));
      
      let matchingWords = 0;
      let sequentialMatches = 0;
      let lastMatchIndex = -1;

      spokenWords.forEach(word => {
        const wordIndex = paragraphWords.findIndex(w => w.includes(word) || word.includes(w));
        if (wordIndex !== -1) {
          matchingWords++;
          if (wordIndex > lastMatchIndex) {
            sequentialMatches++;
          }
          lastMatchIndex = wordIndex;
        }
      });
      
      // 优化置信度计算
      const matchRatio = matchingWords / Math.max(spokenWords.length, 1);
      const sequentialBonus = sequentialMatches / Math.max(matchingWords, 1);
      const confidence = (matchRatio + sequentialBonus) / 2;
      
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

  const getParagraphPosition = (paragraphIndex: number): number => {
    if (paragraphIndex < 0 || paragraphIndex >= paragraphs.length) {
      return 0;
    }

    const charactersBeforeParagraph = paragraphs
      .slice(0, paragraphIndex)
      .reduce((sum, p) => sum + p.length + 1, 0);

    const averageCharacterHeight = 35; // 调整行高
    return charactersBeforeParagraph * (averageCharacterHeight / 50);
  };

  return {
    findMatchingParagraph,
    getParagraphPosition
  };
}