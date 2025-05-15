import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onSpeechRate?: (rate: number) => void;
  language?: string;
}

export function useSpeechRecognition({ 
  onSpeechRate,
  language = 'en-US' 
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string>('');

  // Calculate speech rate based on the length of text and time
  const calculateSpeechRate = useCallback((text: string, duration: number) => {
    // Words per minute calculation
    const words = text.trim().split(/\s+/).length;
    const minutes = duration / 60;
    const wpm = words / minutes;
    
    // Normalize WPM to a scale of 1-5 for scroll speed
    // Assuming normal speech is around 130-150 WPM
    let rate = 3; // Default medium rate
    
    if (wpm < 100) rate = 1; // Very slow
    else if (wpm < 130) rate = 2; // Slow
    else if (wpm < 170) rate = 3; // Medium
    else if (wpm < 200) rate = 4; // Fast
    else rate = 5; // Very fast
    
    return rate;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;

    let startTime = Date.now();
    let lastText = '';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      startTime = Date.now();
    };

    recognitionInstance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[event.results.length - 1].isFinal) {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds
        const rate = calculateSpeechRate(transcript.slice(lastText.length), duration);
        lastText = transcript;
        onSpeechRate?.(rate);
      }
    };

    recognitionInstance.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      if (isListening) {
        recognitionInstance.start();
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
    };
  }, [language, onSpeechRate, calculateSpeechRate]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return {
    isListening,
    error,
    startListening,
    stopListening
  };
}