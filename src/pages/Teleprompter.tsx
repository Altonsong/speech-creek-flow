// 更新常量值
const MENU_HEIGHT = 80; // Control panel height
const SCROLL_TRIGGER_TOP = 0.1; // Trigger scroll when text is in top 10%
const SCROLL_TRIGGER_BOTTOM = 0.7; // Trigger scroll when text is in bottom 70%
const SCROLL_TARGET_POSITION = 0.3; // Position text at 30% from top after scroll

// 优化文本匹配函数
const findElementContainingText = (text: string, container: HTMLElement): HTMLElement | null => {
  const elements = container.getElementsByTagName('p');
  const searchWords = text.toLowerCase()
    .split(' ')
    .filter(word => word.length > 2) // 降低词长度要求
    .filter(word => !['this', 'that', 'then', 'than', 'they', 'there', 'with', 'have', 'and', 'the'].includes(word));
  
  let bestMatch = {
    element: null as HTMLElement | null,
    score: 0
  };

  for (const element of Array.from(elements)) {
    const elementText = element.textContent?.toLowerCase() || '';
    let matchCount = 0;
    let sequentialMatches = 0;
    let lastMatchIndex = -1;

    // 使用更宽松的匹配规则
    searchWords.forEach(word => {
      if (elementText.includes(word)) {
        matchCount++;
        const index = elementText.indexOf(word);
        if (index > lastMatchIndex) {
          sequentialMatches++;
        }
        lastMatchIndex = index;
      }
    });

    // 调整匹配分数计算
    const matchScore = (matchCount / Math.max(searchWords.length, 1)) * 0.7 + 
                      (sequentialMatches / Math.max(matchCount, 1)) * 0.3;

    if (matchScore > bestMatch.score) {
      bestMatch = {
        element: element as HTMLElement,
        score: matchScore
      };
    }
  }

  // 降低匹配阈值
  return bestMatch.score > 0.2 ? bestMatch.element : null;
};

// 优化滚动处理函数
const handleSpeechResult = (text: string) => {
  if (!prompterRef.current || !text.trim()) return;

  const container = prompterRef.current;
  const containerHeight = container.clientHeight;
  const scrollTop = container.scrollTop;

  // 尝试找到匹配的元素
  const element = findElementContainingText(text, container);
  
  if (element) {
    const elementTop = element.offsetTop;
    const elementBottom = elementTop + element.offsetHeight;
    
    // 计算可视区域的阈值
    const topThreshold = scrollTop + containerHeight * SCROLL_TRIGGER_TOP;
    const bottomThreshold = scrollTop + containerHeight * SCROLL_TRIGGER_BOTTOM - MENU_HEIGHT;

    // 如果元素不在理想的可视区域内，触发滚动
    if (elementTop < topThreshold || elementBottom > bottomThreshold) {
      const targetPosition = Math.max(0, 
        elementTop - containerHeight * SCROLL_TARGET_POSITION
      );
      
      // 使用更高的置信度来确保滚动
      scrollTo(container, targetPosition, 0.9);
    }
  } else {
    // 使用段落匹配作为备选方案
    const { matchedParagraphIndex, confidence } = findMatchingParagraph(text);
    const position = getParagraphPosition(matchedParagraphIndex);
    const targetPosition = Math.max(0, 
      position - containerHeight * SCROLL_TARGET_POSITION
    );
    scrollTo(container, targetPosition, Math.max(confidence, 0.5)); // 提高最小置信度
  }
};

// 其他代码保持不变...