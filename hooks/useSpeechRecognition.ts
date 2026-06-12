'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef('');
  const listeningRef = useRef(false);
  const restartTimerRef = useRef<any>(null);

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!supported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = finalRef.current;
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + result[0].transcript;
        } else {
          interimTranscript += (interimTranscript ? ' ' : '') + result[0].transcript;
        }
      }

      finalRef.current = finalTranscript;
      setTranscript(finalTranscript);
      setInterim(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setListening(false);
        listeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (listeningRef.current) {
            try { recognition.start(); } catch {}
          }
        }, 100);
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      listeningRef.current = false;
      try { recognition.abort(); } catch {}
    };
  }, [supported]);

  const start = useCallback(() => {
    if (recognitionRef.current && !listeningRef.current) {
      finalRef.current = '';
      setTranscript('');
      setInterim('');
      listeningRef.current = true;
      setListening(true);
      try { recognitionRef.current.start(); } catch {}
    }
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setListening(false);
    setInterim('');
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setInterim('');
  }, []);

  return { transcript, interim, listening, start, stop, reset, supported };
}
