import { useRef, useCallback } from 'react';

interface ScrollControllerOptions {
  smoothness?: number; // 0-1, higher means smoother transitions
  minConfidence?: number; // Minimum confidence required for position jumps
}

export function useScrollController(options: ScrollControllerOptions = {}) {
  const { 
    smoothness = 0.8,
    minConfidence = 0.05  // 降低最小置信度要求
  } = options;

  const targetScrollRef = useRef(0);
  const currentSpeedRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const scrollTo = useCallback((element: HTMLElement, position: number, confidence: number) => {
    console.log("🎯 Scroll target:", {
      position,
      confidence,
      currentScroll: element.scrollTop
    });

    // 降低跳转门槛，但保持一定限制
    if (confidence >= minConfidence) {
      targetScrollRef.current = position;
      console.log("✨ Updated target position:", position);
    } else {
      // 即使置信度低，也尝试小幅度调整
      const currentPos = element.scrollTop;
      const maxAdjustment = 100; // 最大调整幅度
      const adjustment = (position - currentPos) * (confidence / minConfidence);
      targetScrollRef.current = currentPos + Math.min(Math.abs(adjustment), maxAdjustment) * Math.sign(adjustment);
      console.log("⚠️ Low confidence, making small adjustment");
    }

    if (!animationFrameRef.current) {
      const animate = () => {
        if (!element) return;

        // Calculate distance to target
        const diff = targetScrollRef.current - element.scrollTop;
        
        // Apply smoothing
        const step = diff * (1 - smoothness);
        
        console.log("📊 Scroll animation:", {
          target: targetScrollRef.current,
          current: element.scrollTop,
          step: step.toFixed(2)
        });

        // Update scroll position
        if (Math.abs(step) > 0.5) {
          element.scrollTop += step;
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          element.scrollTop = targetScrollRef.current;
          animationFrameRef.current = undefined;
          console.log("✅ Scroll animation complete");
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [smoothness, minConfidence]);

  const updateScrollSpeed = useCallback((element: HTMLElement, speed: number) => {
    currentSpeedRef.current = speed;
    console.log("🏃‍♂️ Updating scroll speed:", speed);
    
    // Update target scroll position based on speed
    if (element) {
      const speedFactor = Math.pow(1.8, speed - 3); // 调整速度曲线
      targetScrollRef.current = element.scrollTop + (speedFactor * 2);
      
      console.log("📈 New scroll target:", {
        speed,
        factor: speedFactor.toFixed(2),
        target: targetScrollRef.current
      });
      
      // Start animation if not running
      if (!animationFrameRef.current) {
        scrollTo(element, targetScrollRef.current, 1);
      }
    }
  }, [scrollTo]);

  const stopScrolling = useCallback(() => {
    if (animationFrameRef.current) {
      console.log("⏹ Stopping scroll animation");
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