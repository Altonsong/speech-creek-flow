
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="container mx-auto py-6 px-4">
        <div className="flex items-center">
          <Mic className="h-6 w-6 text-teleprompter-accent mr-2" />
          <h1 className="text-2xl font-bold">SpeechCreek 0.9</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Deliver speeches with confidence
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            SpeechCreek is a simple, elegant teleprompter tool designed to help you deliver
            smooth, natural speeches without the distraction of paper notes.
          </p>
          
          <div className="mb-8 relative">
            <div className="aspect-video w-full max-w-2xl mx-auto bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-white text-xl p-8 text-center">
                Your speech will scroll here smoothly, at your desired pace.
              </div>
            </div>
          </div>
          
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-xl mx-auto">
            <li className="flex flex-col items-center">
              <div className="bg-gray-100 p-3 rounded-full mb-2">
                <svg className="h-6 w-6 text-teleprompter-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm">Customizable Text Size</span>
            </li>
            <li className="flex flex-col items-center">
              <div className="bg-gray-100 p-3 rounded-full mb-2">
                <svg className="h-6 w-6 text-teleprompter-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm">Adjustable Speed</span>
            </li>
            <li className="flex flex-col items-center">
              <div className="bg-gray-100 p-3 rounded-full mb-2">
                <svg className="h-6 w-6 text-teleprompter-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </div>
              <span className="text-sm">Full Screen Mode</span>
            </li>
          </ul>
          
          <Button
            onClick={() => navigate("/teleprompter")}
            size="lg"
            className="bg-teleprompter-accent hover:bg-opacity-90 text-white"
          >
            Start Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>

      <footer className="container mx-auto py-6 px-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} SpeechCreek. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
