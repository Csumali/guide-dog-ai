import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import VoiceControls from "@/components/VoiceControls";
import ContinuousMonitoring, { ContinuousMonitoringRef } from "@/components/ContinuousMonitoring";
import { speak } from "@/utils/textToSpeech";
import { keepScreenAwake, detectMobileDevice } from "@/utils/mobileOptimizations";
import { Eye } from "lucide-react";

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
    <div className="min-h-screen bg-background p-4 md:p-8 pb-safe">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <header className="text-center space-y-3 py-4 md:py-8">
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <Eye className="h-10 md:h-12 w-10 md:w-12 text-primary" />
            <h1 className="text-3xl md:text-5xl font-bold text-foreground">PathGuide AI</h1>
          </div>
          <p className="text-lg md:text-2xl text-muted-foreground">
            Your AI navigation companion
          </p>
        </header>

        {/* Voice Controls - Always Visible */}
        <div className="flex justify-center">
          <VoiceControls onCommand={handleVoiceCommand} />
        </div>

        {/* Camera & Safety Monitor */}
        <ContinuousMonitoring ref={monitorRef} onSceneDescription={handleSceneDescription} />

        {sceneDescription && (
          <Card className="p-6 bg-muted">
            <h2 className="text-xl font-semibold text-foreground mb-2">Scene Description:</h2>
            <p className="text-lg text-foreground leading-relaxed">
              {sceneDescription}
            </p>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 bg-card/50">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Voice Commands:</h2>
          <ul className="space-y-3 text-lg text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>"Describe what's in front of me"</strong> - Analyzes the current scene</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>"Find me [object]"</strong> - Locates specific objects (e.g., "find me a crosswalk button")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>"Help"</strong> - Lists available commands</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Index;
