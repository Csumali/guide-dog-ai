import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VoiceControls from "@/components/VoiceControls";
import ContinuousMonitoring, { ContinuousMonitoringRef } from "@/components/ContinuousMonitoring";
import { speak } from "@/utils/textToSpeech";
import { keepScreenAwake, detectMobileDevice } from "@/utils/mobileOptimizations";
import { Dog, Mic, Send } from "lucide-react";

const Index = () => {
  const [sceneDescription, setSceneDescription] = useState<string>("");
  const monitorRef = useRef<ContinuousMonitoringRef>(null);

  useEffect(() => {
    // Mobile optimizations
    if (detectMobileDevice()) {
      keepScreenAwake();
      console.log('Mobile device detected - optimizations enabled');
    }
  }, []);

  const handleSceneDescription = (description: string) => {
    setSceneDescription(description);
    speak(description);
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes("describe") || 
        lowerCommand.includes("what's in front") ||
        lowerCommand.includes("what is in front") ||
        lowerCommand.includes("whats in front") ||
        lowerCommand.includes("what do you see")) {
      speak("Analyzing scene now");
      monitorRef.current?.captureAndAnalyze();
    }
    else if (lowerCommand.includes("find me")) {
      const searchQuery = lowerCommand.replace("find me", "").trim();
      if (searchQuery) {
        speak(`Looking for ${searchQuery}`);
        monitorRef.current?.findObject(searchQuery);
      } else {
        speak("What would you like me to find?");
      }
    }
    else if (lowerCommand.includes("help")) {
      speak("Say 'describe what's in front of me' for scene analysis, or 'find me' followed by what you're looking for.");
    } 
    else {
      speak("I heard: " + command + ". Say 'help' for available commands.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-safe">
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <header className="text-center space-y-2 py-6">
          <div className="flex items-center justify-center gap-3">
            <Dog className="h-10 w-10 text-secondary" />
            <h1 className="text-4xl font-bold text-foreground">Guide Dog AI</h1>
          </div>
          <p className="text-base text-secondary/90">
            Your AI-powered guide that sees, announces, and helps you navigate safely
          </p>
        </header>

        {/* Input Card */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-lg font-medium mb-4 text-foreground">How can I help you?</h2>
          <div className="flex gap-2">
            <Input 
              placeholder="Ask a question or navigate to a place..." 
              className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Mic className="h-5 w-5" />
            </Button>
            <Button size="icon" className="bg-primary hover:bg-primary/90">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Voice Controls */}
        <VoiceControls onCommand={handleVoiceCommand} />

        {/* Camera & Safety Monitor */}
        <ContinuousMonitoring ref={monitorRef} onSceneDescription={handleSceneDescription} />

        {sceneDescription && (
          <Card className="p-6 bg-card border-border">
            <h2 className="text-xl font-semibold text-foreground mb-2">Scene Description:</h2>
            <p className="text-base text-foreground/90 leading-relaxed">
              {sceneDescription}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
