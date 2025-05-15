import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onResult?: (text: string) => void;
  onSpeechRate?: (rate: number) => void;
  language?: string;
}

export function useSpeechRecognition({ 
  onResult,
  onSpeechRate,
  language = 'en-US' 
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  // Calculate speech rate based on the length of text and time
  const calculateSpeechRate = useCallback((text: string, duration: number) => {
    // Words per minute calculation
    const words = text.trim().split(/\s+/).length;
    const minutes = duration / 60;
    const wpm = words / minutes;
    
    console.log("🎯 Speech Stats:", {
      words,
      duration: `${duration.toFixed(2)}s`,
      wpm: `${wpm.toFixed(2)} WPM`
    });
    
    // Normalize WPM to a scale of 1-5 for scroll speed
    // Assuming normal speech is around 130-150 WPM
    let rate = 3; // Default medium rate
    
    if (wpm < 100) rate = 1; // Very slow
    else if (wpm < 130) rate = 2; // Slow
    else if (wpm < 170) rate = 3; // Medium
    else if (wpm < 200) rate = 4; // Fast
    else rate = 5; // Very fast
    
    console.log("🏃‍♂️ Calculated rate:", rate);
    return rate;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("❌ Speech recognition not supported");
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;

    let startTime = Date.now();
    let lastProcessedLength = 0;

    recognitionInstance.onstart = () => {
      console.log("🎤 Speech recognition started");
      setIsListening(true);
      startTime = Date.now();
      setInterimTranscript('');
      setFinalTranscript('');
    };

    recognitionInstance.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);
      setFinalTranscript(final);

      // Calculate rate for new content
      const newContent = final.slice(lastProcessedLength);
      if (newContent.length > 0) {
        console.log("🗣 New speech content:", newContent);
        const duration = (Date.now() - startTime) / 1000;
        const rate = calculateSpeechRate(newContent, duration);
        onSpeechRate?.(rate);
        lastProcessedLength = final.length;
      }

      // Send combined transcript to parent component
      const fullTranscript = `${final} ${interim}`.trim();
      console.log("📝 Full transcript:", fullTranscript);
      onResult?.(fullTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error("❌ Speech recognition error:", event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      console.log("🛑 Speech recognition ended");
      setIsListening(false);
      if (isListening) {
        recognitionInstance.start();
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
    };
  }, [language, onResult, onSpeechRate, calculateSpeechRate]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      console.log("▶️ Starting speech recognition");
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      console.log("⏹ Stopping speech recognition");
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return {
    isListening,
    error,
    transcript: `${finalTranscript} ${interimTranscript}`.trim(),
    startListening,
    stopListening
  };
}