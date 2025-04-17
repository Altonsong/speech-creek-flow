
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Play,
  Pause,
  ArrowLeft,
  Maximize,
  Minimize,
  Type,
  Palette,
  AlignVerticalDistributeStart,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Teleprompter = () => {
  const { toast } = useToast();
  const [script, setScript] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1-5 scale
  const [textSize, setTextSize] = useState("medium"); // "small", "medium", "large"
  const [textColor, setTextColor] = useState("white"); // "white", "yellow", "lightblue"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  
  const prompterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch((err) => {
            toast({
              title: "Fullscreen Error",
              description: `Error attempting to enable fullscreen: ${err.message}`,
              variant: "destructive",
            });
          });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch((err) => {
            toast({
              title: "Fullscreen Error",
              description: `Error attempting to exit fullscreen: ${err.message}`,
              variant: "destructive",
            });
          });
      }
    }
  };
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  
  // Enter presentation mode
  const enterPresentationMode = () => {
    setIsPresentationMode(true);
    // Wait for component to render in presentation mode before starting scroll
    setTimeout(() => {
      if (!isScrolling) {
        toggleScrolling();
      }
    }, 100);
  };
  
  // Exit presentation mode
  const exitPresentationMode = () => {
    setIsPresentationMode(false);
    if (isScrolling) {
      toggleScrolling();
    }
    // Reset scroll position
    if (prompterRef.current) {
      prompterRef.current.scrollTop = 0;
    }
  };
  
  // Start/stop scrolling
  const toggleScrolling = () => {
    if (isScrolling) {
      if (scrollIntervalRef.current !== null) {
        cancelAnimationFrame(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    } else {
      // Using requestAnimationFrame for smoother scrolling
      let lastTime = 0;
      const scrollStep = () => {
        const now = Date.now();
        const speedMap = {
          1: 40, // Slow - lower number means faster scroll
          2: 25, // Normal slow
          3: 15, // Normal
          4: 10, // Normal fast
          5: 6  // Fast - higher speed
        };

        // Only scroll if enough time has passed based on speed setting
        if (now - lastTime > speedMap[scrollSpeed as keyof typeof speedMap]) {
          lastTime = now;
          
          if (prompterRef.current) {
            prompterRef.current.scrollTop += 1;
            
            // Auto-stop when reaching the end
            if (
              prompterRef.current.scrollHeight - prompterRef.current.scrollTop <=
              prompterRef.current.clientHeight + 10
            ) {
              setIsScrolling(false);
              // Reset scroll to top
              prompterRef.current.scrollTop = 0;
              return;
            }
          }
        }
        
        scrollIntervalRef.current = requestAnimationFrame(scrollStep);
      };
      
      scrollIntervalRef.current = requestAnimationFrame(scrollStep);
    }
    
    setIsScrolling(!isScrolling);
  };
  
  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current !== null) {
        cancelAnimationFrame(scrollIntervalRef.current);
      }
    };
  }, []);

  // Stop scrolling if speed changes while scrolling
  useEffect(() => {
    if (isScrolling) {
      // Restart scrolling with new speed
      toggleScrolling();
      toggleScrolling();
    }
  }, [scrollSpeed]);
  
  // Get text size class
  const getTextSizeClass = () => {
    switch (textSize) {
      case "small":
        return "text-lg md:text-xl";
      case "medium":
        return "text-xl md:text-2xl";
      case "large":
        return "text-2xl md:text-3xl";
      default:
        return "text-xl md:text-2xl";
    }
  };
  
  // Get text color class
  const getTextColorClass = () => {
    switch (textColor) {
      case "yellow":
        return "text-yellow-400";
      case "lightblue":
        return "text-blue-300";
      case "white":
      default:
        return "text-white";
    }
  };

  // If in presentation mode, render presentation view
  if (isPresentationMode) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col" ref={containerRef}>
        <div 
          ref={prompterRef}
          className="flex-1 overflow-y-auto px-8 py-16"
        >
          <p className={`${getTextSizeClass()} ${getTextColorClass()} leading-relaxed text-center`}>
            {script}
          </p>
        </div>
        
        {/* Floating control panel */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg px-4 py-3 flex flex-wrap gap-4 items-center shadow-lg border border-gray-800 backdrop-blur-sm animate-fade-in">
          <Button
            onClick={toggleScrolling}
            variant="outline"
            size="sm"
            className="bg-black/90 border-gray-700 text-white hover:bg-gray-800"
          >
            {isScrolling ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isScrolling ? "Pause" : "Play"}
          </Button>
          
          <div className="flex items-center gap-2">
            <AlignVerticalDistributeStart className="h-4 w-4 text-gray-400" />
            <Slider
              value={[scrollSpeed]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => setScrollSpeed(value[0])}
              className="w-28"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTextSize("small")}
              className={`${textSize === "small" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 px-2`}
            >
              <Type className="h-3 w-3" />
              <span className="ml-1">S</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTextSize("medium")}
              className={`${textSize === "medium" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 px-2`}
            >
              <Type className="h-4 w-4" />
              <span className="ml-1">M</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTextSize("large")}
              className={`${textSize === "large" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 px-2`}
            >
              <Type className="h-5 w-5" />
              <span className="ml-1">L</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-400" />
            <div className="flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTextColor("white")}
                className={`rounded-r-none ${textColor === "white" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 p-1`}
              >
                <div className="h-4 w-4 bg-white rounded-full border border-gray-600"></div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTextColor("yellow")}
                className={`rounded-none ${textColor === "yellow" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 p-1`}
              >
                <div className="h-4 w-4 bg-yellow-400 rounded-full"></div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTextColor("lightblue")}
                className={`rounded-l-none ${textColor === "lightblue" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 p-1`}
              >
                <div className="h-4 w-4 bg-blue-300 rounded-full"></div>
              </Button>
            </div>
          </div>
          
          <Button
            onClick={exitPresentationMode}
            variant="outline"
            size="sm"
            className="bg-black/90 border-gray-700 text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    );
  }
  
  // Regular editor view
  return (
    <div className="min-h-screen bg-white flex flex-col" ref={containerRef}>
      {!isFullscreen && (
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto py-4 px-4 flex items-center justify-between">
            <Link to="/" className="flex items-center text-xl font-bold">
              <ArrowLeft className="h-5 w-5 mr-2" /> Back
            </Link>
            <h1 className="text-xl font-bold">SpeechCreek</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col ${isFullscreen ? 'bg-black' : 'container mx-auto py-6 px-4'}`}>
        {!isFullscreen && (
          <div className="mb-6">
            <Textarea
              placeholder="Paste or type your speech here..."
              className="min-h-[200px]"
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          </div>
        )}

        <div className={`${isFullscreen ? 'flex-1' : 'border border-gray-200 rounded-lg bg-black'}`}>
          <div 
            ref={prompterRef}
            className={`h-full overflow-y-auto p-8 ${getTextColorClass()} leading-relaxed`}
            style={{
              whiteSpace: "pre-wrap"
            }}
          >
            {script ? (
              <p className={`${getTextSizeClass()}`}>{script}</p>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Your speech will appear here</p>
              </div>
            )}
          </div>
        </div>

        {(!isFullscreen || document.fullscreenElement) && (
          <div className={`mt-4 flex flex-wrap gap-4 items-center ${isFullscreen ? 'p-4 bg-black/70 rounded-t-lg' : ''}`}>
            {/* Presentation Mode Button */}
            <Button
              onClick={enterPresentationMode}
              variant="default"
              disabled={!script.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Presentation Mode
            </Button>
            
            {/* Original Scroll Controls */}
            <Button
              onClick={toggleScrolling}
              variant="outline"
              className={`${isFullscreen ? 'bg-black/90 border-gray-700 text-white' : ''}`}
            >
              {isScrolling ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isScrolling ? "Pause" : "Play"}
            </Button>
            
            <div className="flex items-center gap-2">
              <AlignVerticalDistributeStart className={`h-4 w-4 ${isFullscreen ? 'text-white' : ''}`} />
              <Slider
                value={[scrollSpeed]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setScrollSpeed(value[0])}
                className="w-28"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTextSize("small")}
                className={`${textSize === "small" ? 'bg-gray-200' : ''} ${isFullscreen ? 'text-white hover:bg-gray-700' : ''} px-2`}
              >
                <Type className="h-4 w-4" />
                <span className="ml-1">S</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTextSize("medium")}
                className={`${textSize === "medium" ? 'bg-gray-200' : ''} ${isFullscreen ? 'text-white hover:bg-gray-700' : ''} px-2`}
              >
                <Type className="h-4 w-4" />
                <span className="ml-1">M</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTextSize("large")}
                className={`${textSize === "large" ? 'bg-gray-200' : ''} ${isFullscreen ? 'text-white hover:bg-gray-700' : ''} px-2`}
              >
                <Type className="h-4 w-4" />
                <span className="ml-1">L</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Palette className={`h-4 w-4 ${isFullscreen ? 'text-white' : ''}`} />
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTextColor("white")}
                  className={`rounded-r-none ${textColor === "white" ? 'bg-gray-200' : ''} ${isFullscreen ? 'text-white hover:bg-gray-700' : ''} p-1`}
                >
                  <div className="h-4 w-4 bg-white rounded-full border border-gray-300"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTextColor("yellow")}
                  className={`rounded-none ${textColor === "yellow" ? 'bg-gray-200' : ''} ${isFullscreen ? 'text-white hover:bg-gray-700' : ''} p-1`}
                >
                  <div className="h-4 w-4 bg-yellow-400 rounded-full"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTextColor("lightblue")}
                  className={`rounded-l-none ${textColor === "lightblue" ? 'bg-gray-200' : ''} ${isFullscreen ? 'text-white hover:bg-gray-700' : ''} p-1`}
                >
                  <div className="h-4 w-4 bg-blue-300 rounded-full"></div>
                </Button>
              </div>
            </div>
            
            <div className="ml-auto">
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                className={`${isFullscreen ? 'bg-black/90 border-gray-700 text-white' : ''}`}
              >
                {isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {!isFullscreen && (
        <footer className="border-t border-gray-200 py-4 px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SpeechCreek. All rights reserved.
        </footer>
      )}
    </div>
  );
};

export default Teleprompter;
