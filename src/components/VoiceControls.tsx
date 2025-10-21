import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceControlsProps {
  onCommand: (command: string) => void;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

const VoiceControls = ({ onCommand }: VoiceControlsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('Voice command:', transcript);
        onCommand(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Auto-restart on error
        if (event.error !== 'aborted') {
          setTimeout(() => {
            try {
              recognitionInstance.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }, 1000);
        }
      };

      recognitionInstance.onend = () => {
        // Auto-restart when it ends
        console.log('Recognition ended, restarting...');
        setTimeout(() => {
          try {
            recognitionInstance.start();
            setIsListening(true);
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }, 500);
      };

      setRecognition(recognitionInstance);
      
      // Auto-start listening
      try {
        recognitionInstance.start();
        setIsListening(true);
        console.log('Voice recognition auto-started');
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [onCommand]);

  // No UI - always listening in background
  return null;
};

export default VoiceControls;
