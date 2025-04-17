
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  ArrowLeft,
  Maximize,
  Minimize,
  Type,
  Palette,
  AlignVerticalDistributeStart
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
  
  const prompterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Start/stop scrolling
  const toggleScrolling = () => {
    if (isScrolling) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    } else {
      const speedMap = {
        1: 30, // Slow - 30ms for each pixel
        2: 25, // Normal slow
        3: 20, // Normal
        4: 15, // Normal fast
        5: 10  // Fast - 10ms for each pixel
      };
      
      scrollIntervalRef.current = setInterval(() => {
        if (prompterRef.current) {
          prompterRef.current.scrollTop += 1;
          
          // Auto-stop when reaching the end
          if (
            prompterRef.current.scrollHeight - prompterRef.current.scrollTop <=
            prompterRef.current.clientHeight + 10
          ) {
            toggleScrolling();
            // Reset scroll to top
            prompterRef.current.scrollTop = 0;
          }
        }
      }, speedMap[scrollSpeed as keyof typeof speedMap]);
    }
    
    setIsScrolling(!isScrolling);
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);
  
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
        return "text-teleprompter-yellow";
      case "lightblue":
        return "text-teleprompter-lightblue";
      case "white":
      default:
        return "text-white";
    }
  };
  
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
                  <div className="h-4 w-4 bg-teleprompter-yellow rounded-full"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTextColor("lightblue")}
                  className={`rounded-l-none ${textColor === "lightblue" ? 'bg-gray-200' : ''} ${isFullscreen ? 'text-white hover:bg-gray-700' : ''} p-1`}
                >
                  <div className="h-4 w-4 bg-teleprompter-lightblue rounded-full"></div>
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
