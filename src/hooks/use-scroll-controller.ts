interface ScrollControllerOptions {
  smoothness: number;
  minConfidence: number;
}

export function useScrollController({ smoothness = 0.8, minConfidence = 0.3 }: ScrollControllerOptions) {
  let isScrolling = false;
  let currentSpeed = 2;
  let animationFrameId: number;

  const scrollTo = (element: HTMLElement, targetPosition: number, confidence: number) => {
    // 如果置信度太低就不滚动
    if (confidence < minConfidence) {
      console.log('Skipping scroll due to low confidence:', confidence);
      return;
    }
    
    const startPosition = element.scrollTop;
    const distance = targetPosition - startPosition;
    
    // 如果距离太小也不滚动
    if (Math.abs(distance) < 50) {
      return;
    }

    let startTime: number | null = null;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / 1000; // 转换为秒
      
      // 使用 easeInOutCubic 缓动函数使滚动更自然
      const easeInOutCubic = (t: number) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      
      const easedProgress = easeInOutCubic(Math.min(progress / smoothness, 1));
      const newPosition = startPosition + distance * easedProgress;
      
      element.scrollTop = newPosition;
      
      if (progress < smoothness) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    // 取消之前的动画
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animate);
  };

  const updateScrollSpeed = (element: HTMLElement, speed: number) => {
    if (isNaN(speed) || speed < 1 || speed > 5) {
      console.log('Invalid scroll speed:', speed);
      return;
    }

    currentSpeed = speed;
    if (isScrolling) {
      // 根据新速度调整滚动
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