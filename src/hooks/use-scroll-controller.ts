interface ScrollControllerOptions {
  smoothness: number;
  minConfidence: number;
}

export function useScrollController({ smoothness = 0.8, minConfidence = 0.3 }: ScrollControllerOptions) {
  let isScrolling = false;
  let currentSpeed = 2;
  let animationFrameId: number;

  const scrollTo = (element: HTMLElement, targetPosition: number, confidence: number) => {
    if (confidence < minConfidence) return;
    
    const startPosition = element.scrollTop;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / 1000; // Convert to seconds
      
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
    
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animate);
  };

  const updateScrollSpeed = (element: HTMLElement, speed: number) => {
    currentSpeed = speed;
    if (isScrolling) {
      // Adjust scrolling based on new speed
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