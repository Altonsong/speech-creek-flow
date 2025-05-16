import { useMemo } from 'react';

interface TextMatchResult {
  matchedParagraphIndex: number;
  confidence: number;
}

export function useTextMatcher(script: string) {
  // 将脚本分割成段落并缓存
  const paragraphs = useMemo(() => {
    return script.split('\n').filter(p => p.trim().length > 0);
  }, [script]);

  // 找到最匹配的段落
  const findMatchingParagraph = (spokenText: string): TextMatchResult => {
    if (!spokenText || paragraphs.length === 0) {
      return { matchedParagraphIndex: 0, confidence: 0 };
    }

    let bestMatchIndex = 0;
    let highestConfidence = 0;

    // 将语音文本转换为小写并分割成重要单词
    const normalizedSpokenText = spokenText.toLowerCase();
    const spokenWords = normalizedSpokenText.split(' ')
      .filter(word => word.length > 2) // 降低词长度要求
      .filter(word => !['this', 'that', 'then', 'than', 'they', 'there', 'with', 'have', 'and', 'the'].includes(word));

    // 将语音文本与每个段落进行比较
    paragraphs.forEach((paragraph, index) => {
      const normalizedParagraph = paragraph.toLowerCase();
      const paragraphWords = normalizedParagraph.split(' ')
        .filter(word => word.length > 2)
        .filter(word => !['this', 'that', 'then', 'than', 'they', 'there', 'with', 'have', 'and', 'the'].includes(word));
      
      // 计算匹配的单词数量和它们的位置
      let matchingWords = 0;
      let sequentialMatches = 0;
      let lastMatchIndex = -1;

      spokenWords.forEach(word => {
        const wordIndex = paragraphWords.indexOf(word);
        if (wordIndex !== -1) {
          matchingWords++;
          if (wordIndex > lastMatchIndex) {
            sequentialMatches++;
          }
          lastMatchIndex = wordIndex;
        }
      });
      
      // 计算置信度分数 (0-1)，并为连续匹配加分
      const matchRatio = matchingWords / Math.max(spokenWords.length, paragraphWords.length);
      const sequentialBonus = sequentialMatches / matchingWords;
      const confidence = matchRatio * (1 + sequentialBonus) / 2;
      
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

  // 计算段落的滚动位置
  const getParagraphPosition = (paragraphIndex: number): number => {
    if (paragraphIndex < 0 || paragraphIndex >= paragraphs.length) {
      return 0;
    }

    // 根据字符数计算大致位置
    const charactersBeforeParagraph = paragraphs
      .slice(0, paragraphIndex)
      .reduce((sum, p) => sum + p.length + 1, 0); // +1 表示换行符

    // 估算滚动位置 (假设平均字符高度)
    const averageCharacterHeight = 30; // 每行大约的像素高度
    return charactersBeforeParagraph * (averageCharacterHeight / 50); // 调整以获得合理的滚动
  };

  return {
    findMatchingParagraph,
    getParagraphPosition
  };
}