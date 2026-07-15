import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(lang = 'en-IN') {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(
    (onResult: (text: string) => void, onError?: (msg: string) => void) => {
      const SpeechRecognition = getSpeechRecognition();
      if (!SpeechRecognition) {
        onError?.('Voice input is not supported in this browser. Try Chrome.');
        return;
      }

      recognitionRef.current?.abort();
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) onResult(transcript);
      };

      recognition.onerror = (event) => {
        if (event.error !== 'aborted') {
          onError?.(event.error === 'not-allowed' ? 'Microphone permission denied' : 'Voice input failed');
        }
        setListening(false);
      };

      recognition.onend = () => setListening(false);

      try {
        recognition.start();
        setListening(true);
      } catch {
        onError?.('Could not start voice input');
        setListening(false);
      }
    },
    [lang],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, startListening, stopListening };
}
