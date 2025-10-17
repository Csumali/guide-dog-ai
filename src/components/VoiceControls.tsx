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
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice command:', transcript);
        onCommand(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice recognition error",
          description: "Could not process voice command. Please try again.",
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onCommand, toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your command",
      });
    }
  };

  return (
    <Button
      onClick={toggleListening}
      size="lg"
      variant={isListening ? "destructive" : "default"}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-14 text-base"
    >
      {isListening ? (
        <>
          <MicOff className="mr-2 h-5 w-5" />
          Stop Listening
        </>
      ) : (
        <>
          <Mic className="mr-2 h-5 w-5" />
          Ask Question
        </>
      )}
    </Button>
  );
};

export default VoiceControls;
