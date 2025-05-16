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
  X,
  Mic,
  MicOff
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTextMatcher } from "@/hooks/use-text-matcher";
import { useScrollController } from "@/hooks/use-scroll-controller";

const Teleprompter = () => {
  const { toast } = useToast();
  const [script, setScript] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [textSize, setTextSize] = useState("medium");
  const [textColor, setTextColor] = useState("white");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  
  const prompterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to find element containing text
  const findElementContainingText = (text: string, container: HTMLElement): HTMLElement | null => {
    const elements = container.getElementsByTagName('p');
    for (const element of Array.from(elements)) {
      if (element.textContent?.toLowerCase().includes(text.toLowerCase())) {
        console.log('Found matching element:', element.textContent);
        return element;
      }
    }
    console.log('No matching element found for text:', text);
    return null;
  };

  // Initialize text matcher and scroll controller
  const { findMatchingParagraph, getParagraphPosition } = useTextMatcher(script);
  const { scrollTo, updateScrollSpeed, stopScrolling } = useScrollController({
    smoothness: 0.8,
    minConfidence: 0.3
  });

  // Handle speech recognition results
  const handleSpeechResult = (text: string) => {
    if (!prompterRef.current || !text.trim()) return;

    const container = prompterRef.current;
    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;

    // Try to find the element containing the recognized text
    const element = findElementContainingText(text, container);
    
    if (element) {
      const elementTop = element.offsetTop;
      console.log('Element position:', {
        elementTop,
        scrollTop,
        containerHeight,
        threshold: scrollTop + containerHeight * 0.4
      });

      // Trigger scroll if element is outside the desired viewing area
      if (elementTop < scrollTop || elementTop > scrollTop + containerHeight * 0.4) {
        const targetPosition = elementTop - containerHeight * 0.3;
        console.log('Scrolling to position:', targetPosition);
        scrollTo(container, targetPosition, 1);
      }
    } else {
      // Fallback to paragraph matching
      console.log('Using fallback paragraph matching');
      const { matchedParagraphIndex, confidence } = findMatchingParagraph(text);
      const position = getParagraphPosition(matchedParagraphIndex);
      const targetPosition = Math.max(0, position - containerHeight * 0.3);
      scrollTo(container, targetPosition, confidence);
    }
  };

  // Handle speech rate changes
  const handleSpeechRate = (rate: number) => {
    if (!prompterRef.current || isNaN(rate)) {
      console.log('Invalid speech rate:', rate);
      return;
    }
    console.log('Updating scroll speed to:', rate);
    setScrollSpeed(rate);
    updateScrollSpeed(prompterRef.current, rate);
  };

  const { isListening, error, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onSpeechRate: handleSpeechRate
  });

  // Auto start speech recognition when entering presentation mode
  useEffect(() => {
    if (isPresentationMode) {
      console.log('Starting speech recognition in presentation mode');
      startListening();
    }
  }, [isPresentationMode]);

  // Enter presentation mode
  const enterPresentationMode = () => {
    setIsPresentationMode(true);
  };

  // Exit presentation mode
  const exitPresentationMode = () => {
    setIsPresentationMode(false);
    stopListening();
    stopScrolling();
    if (prompterRef.current) {
      prompterRef.current.scrollTop = 0;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          toast({
            title: "Fullscreen Error",
            description: `Error attempting to enable fullscreen: ${err.message}`,
            variant: "destructive",
          });
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => {
          toast({
            title: "Fullscreen Error",
            description: `Error attempting to exit fullscreen: ${err.message}`,
            variant: "destructive",
          });
        });
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

  // Get text size class
  const getTextSizeClass = () => {
    switch (textSize) {
      case "small":
        return "text-2xl md:text-3xl";
      case "medium":
        return "text-3xl md:text-4xl";
      case "large":
        return "text-4xl md:text-5xl";
      default:
        return "text-3xl md:text-4xl";
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

  const renderControlPanel = () => (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg px-4 py-3 flex flex-wrap gap-4 items-center shadow-lg border border-gray-800 backdrop-blur-sm animate-fade-in">
      <Button
        onClick={isListening ? stopListening : startListening}
        variant="outline"
        size="sm"
        className={`bg-black/90 border-gray-700 text-white hover:bg-gray-800 ${
          isListening ? 'bg-emerald-900/50' : ''
        }`}
      >
        {isListening ? (
          <Mic className="h-4 w-4 mr-2 text-emerald-500" />
        ) : (
          <MicOff className="h-4 w-4 mr-2" />
        )}
        {isListening ? "Stop Voice" : "Start Voice"}
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
          <Type className="h-5 w-5" />
          <span className="ml-1">S</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTextSize("medium")}
          className={`${textSize === "medium" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 px-2`}
        >
          <Type className="h-6 w-6" />
          <span className="ml-1">M</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTextSize("large")}
          className={`${textSize === "large" ? 'bg-gray-700' : ''} text-white hover:bg-gray-700 px-2`}
        >
          <Type className="h-7 w-7" />
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
  );

  // If in presentation mode, render presentation view
  if (isPresentationMode) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col" ref={containerRef}>
        <div 
          ref={prompterRef}
          className="flex-1 overflow-y-auto px-8 py-16"
        >
          <p className={`${getTextSizeClass()} ${getTextColorClass()} leading-relaxed tracking-wider text-center`}>
            {script}
          </p>
        </div>
        {renderControlPanel()}
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
            <div className="w-20"></div>
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
              onClick={enterPresentationMode}
              variant="default"
              disabled={!script.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Presentation Mode
            </Button>
            
            <Button
              onClick={isListening ? stopListening : startListening}
              variant="outline"
              className={`${isFullscreen ? 'bg-black/90 border-gray-700 text-white' : ''} ${
                isListening ? 'bg-emerald-900/50' : ''
              }`}
            >
              {isListening ? (
                <Mic className="h-4 w-4 mr-2 text-emerald-500" />
              ) : (
                <MicOff className="h-4 w-4 mr-2" />
              )}
              {isListening ? "Stop Voice" : "Start Voice"}
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