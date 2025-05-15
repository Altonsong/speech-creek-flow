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
    const words = text.trim().split(/\s+/).length;
    const minutes = duration / 60;
    const wpm = words / minutes;
    
    // Convert WPM to 1-5 scale
    const normalizedRate = Math.max(1, Math.min(5, Math.round(wpm / 60)));
    console.log(`Speech rate calculated: ${wpm} WPM, normalized to: ${normalizedRate}`);
    return normalizedRate;
  }, []);

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognition) return;

    let startTime: number;
    let lastProcessedText = '';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      startTime = Date.now();
      lastProcessedText = '';
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
          const duration = (Date.now() - startTime) / 1000;
          const rate = calculateSpeechRate(transcript, duration);
          console.log(`Calling onSpeechRate with rate: ${rate}`);
          onSpeechRate(rate);
        }

        lastProcessedText = transcript;
      }
    };
  }, [recognition, onResult, onSpeechRate, calculateSpeechRate]);

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