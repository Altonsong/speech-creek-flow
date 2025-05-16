import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionOptions {
  onResult?: (text: string) => void;
  onSpeechRate?: (rate: number) => void;
}

interface SpeechRecognitionHook {
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition({
  onResult,
  onSpeechRate
}: SpeechRecognitionOptions = {}): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('Initializing speech recognition...');

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      console.log('Speech recognition initialized successfully');
      setRecognition(recognitionInstance);
      setError(null);
    } else {
      const errorMsg = 'Speech recognition is not supported in this browser.';
      console.error(errorMsg);
      setError(errorMsg);
    }
  }, []);

  // Calculate speech rate based on word count and time
  const calculateSpeechRate = useCallback((text: string, duration: number) => {
    if (!text.trim() || duration <= 0) {
      return 2; // Default rate if invalid input
    }

    const words = text.trim().split(/\s+/).length;
    const minutes = duration / 60;
    const wpm = words / minutes;
    
    // Convert WPM to 1-5 scale
    // Typical speaking rates: slow ~100 WPM, normal ~150 WPM, fast ~200 WPM
    // Map these to our 1-5 scale
    let normalizedRate = 1;
    if (wpm <= 100) normalizedRate = 1;
    else if (wpm <= 150) normalizedRate = 2;
    else if (wpm <= 200) normalizedRate = 3;
    else if (wpm <= 250) normalizedRate = 4;
    else normalizedRate = 5;

    console.log(`Speech rate calculated: ${wpm} WPM, normalized to: ${normalizedRate}`);
    return normalizedRate;
  }, []);

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setLastProcessTime(Date.now());
      setWordCount(0);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      const errorMsg = `Speech recognition error: ${event.error}`;
      console.error(errorMsg);
      setError(errorMsg);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const confidence = event.results[current][0].confidence;

      console.log(`Speech recognized: "${transcript}" (confidence: ${confidence})`);

      if (event.results[current].isFinal) {
        if (onResult) {
          console.log('Calling onResult with transcript');
          onResult(transcript);
        }

        // Calculate and report speech rate
        if (onSpeechRate) {
          const currentTime = Date.now();
          const duration = (currentTime - lastProcessTime) / 1000;
          const rate = calculateSpeechRate(transcript, duration);
          
          if (!isNaN(rate)) {
            console.log(`Calling onSpeechRate with rate: ${rate}`);
            onSpeechRate(rate);
          }
          
          setLastProcessTime(currentTime);
          setWordCount(wordCount + transcript.trim().split(/\s+/).length);
        }
      }
    };
  }, [recognition, onResult, onSpeechRate, calculateSpeechRate, lastProcessTime, wordCount]);

  const startListening = useCallback(() => {
    console.log('Attempting to start speech recognition...');
    console.log('Current state - recognition:', !!recognition, 'isListening:', isListening);

    if (!recognition) {
      const errorMsg = 'Speech recognition not initialized';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (isListening) {
      console.log('Already listening, stopping first...');
      recognition.stop();
    }

    try {
      // Small delay to ensure previous instance is fully stopped
      setTimeout(() => {
        recognition.start();
        setError(null);
        console.log('Speech recognition started successfully');
      }, 100);
    } catch (err) {
      const errorMsg = `Error starting speech recognition: ${err}`;
      console.error(errorMsg);
      setError(errorMsg);
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    console.log('Attempting to stop speech recognition...');
    if (recognition && isListening) {
      recognition.stop();
      console.log('Speech recognition stopped');
    } else {
      console.log('No active speech recognition to stop');
    }
  }, [recognition, isListening]);

  return {
    isListening,
    error,
    startListening,
    stopListening
  };
}