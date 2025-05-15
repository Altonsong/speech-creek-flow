import { useRef, useCallback } from 'react';

interface ScrollControllerOptions {
  smoothness?: number; // 0-1, higher means smoother transitions
  minConfidence?: number; // Minimum confidence required for position jumps
}

export function useScrollController(options: ScrollControllerOptions = {}) {
  const { 
    smoothness = 0.8,
    minConfidence = 0.3
  } = options;

  const targetScrollRef = useRef(0);
  const currentSpeedRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const scrollTo = useCallback((element: HTMLElement, position: number, confidence: number) => {
    // Only make large jumps if confidence is high enough
    if (confidence >= minConfidence) {
      targetScrollRef.current = position;
    }

    if (!animationFrameRef.current) {
      const animate = () => {
        if (!element) return;

        // Calculate distance to target
        const diff = targetScrollRef.current - element.scrollTop;
        
        // Apply smoothing
        const step = diff * (1 - smoothness);
        
        // Update scroll position
        if (Math.abs(step) > 0.5) {
          element.scrollTop += step;
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          element.scrollTop = targetScrollRef.current;
          animationFrameRef.current = undefined;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [smoothness, minConfidence]);

  const updateScrollSpeed = useCallback((element: HTMLElement, speed: number) => {
    currentSpeedRef.current = speed;
    
    // Update target scroll position based on speed
    if (element) {
      const speedFactor = Math.pow(2, speed - 3); // Convert 1-5 scale to exponential factor
      targetScrollRef.current = element.scrollTop + (speedFactor * 2);
      
      // Start animation if not running
      if (!animationFrameRef.current) {
        scrollTo(element, targetScrollRef.current, 1);
      }
    }
  }, [scrollTo]);

  const stopScrolling = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  return {
    scrollTo,
    updateScrollSpeed,
    stopScrolling
  };
}