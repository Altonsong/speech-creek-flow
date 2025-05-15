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

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      setRecognition(recognitionInstance);
      setError(null);
    } else {
      setError('Speech recognition is not supported in this browser.');
    }
  }, []);

  // Calculate speech rate based on word count and time
  const calculateSpeechRate = useCallback((text: string, duration: number) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = duration / 60;
    const wpm = words / minutes;
    
    // Convert WPM to 1-5 scale
    const normalizedRate = Math.max(1, Math.min(5, Math.round(wpm / 60)));
    return normalizedRate;
  }, []);

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognition) return;

    let startTime: number;
    let lastProcessedText = '';

    recognition.onstart = () => {
      setIsListening(true);
      startTime = Date.now();
      lastProcessedText = '';
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const confidence = event.results[current][0].confidence;

      if (event.results[current].isFinal) {
        if (onResult) {
          onResult(transcript);
        }

        // Calculate and report speech rate
        if (onSpeechRate) {
          const duration = (Date.now() - startTime) / 1000;
          const rate = calculateSpeechRate(transcript, duration);
          onSpeechRate(rate);
        }

        lastProcessedText = transcript;
      }
    };
  }, [recognition, onResult, onSpeechRate, calculateSpeechRate]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setError(null);
      } catch (err) {
        setError('Error starting speech recognition');
        console.error('Speech recognition error:', err);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  return {
    isListening,
    error,
    startListening,
    stopListening
  };
}