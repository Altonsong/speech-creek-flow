interface ScrollControllerOptions {
  smoothness: number;
  minConfidence: number;
}

export function useScrollController({ smoothness = 0.8, minConfidence = 0.3 }: ScrollControllerOptions) {
  let isScrolling = false;
  let currentSpeed = 2;
  let animationFrameId: number;

  const scrollTo = (element: HTMLElement, targetPosition: number, confidence: number) => {
    // 降低置信度要求，提高滚动触发率
    if (confidence < 0.2) {
      return;
    }
    
    const startPosition = element.scrollTop;
    const distance = targetPosition - startPosition;
    
    // 只在有意义的滚动距离时触发
    if (Math.abs(distance) < 30) {
      return;
    }

    let startTime: number | null = null;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / 1000;
      
      // 使用更平滑的缓动函数
      const easeInOutQuad = (t: number) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      };
      
      const easedProgress = easeInOutQuad(Math.min(progress / smoothness, 1));
      const newPosition = startPosition + distance * easedProgress;
      
      element.scrollTop = newPosition;
      
      if (progress < smoothness) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animate);
  };

  const updateScrollSpeed = (element: HTMLElement, speed: number) => {
    if (isNaN(speed) || speed < 1 || speed > 5) return;

    currentSpeed = speed;
    if (isScrolling) {
      const targetPosition = element.scrollTop + (speed * 100);
      scrollTo(element, targetPosition, 1);
    }
  };

  const stopScrolling = () => {
    isScrolling = false;
    cancelAnimationFrame(animationFrameId);
  };

  return {
    scrollTo,
    updateScrollSpeed,
    stopScrolling
  };
}