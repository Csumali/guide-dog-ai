import { useState, useEffect, useRef } from "react";
import VoiceControls from "@/components/VoiceControls";
import ContinuousMonitoring, { ContinuousMonitoringRef } from "@/components/ContinuousMonitoring";
import { speak } from "@/utils/textToSpeech";
import { keepScreenAwake, detectMobileDevice } from "@/utils/mobileOptimizations";

const Index = () => {
  const [sceneDescription, setSceneDescription] = useState<string>("");
  const monitorRef = useRef<ContinuousMonitoringRef>(null);

  useEffect(() => {
    // Mobile optimizations
    if (detectMobileDevice()) {
      keepScreenAwake();
      console.log('Mobile device detected - optimizations enabled');
    }
    
    // Auto-start monitoring on launch
    setTimeout(() => {
      monitorRef.current?.captureAndAnalyze();
    }, 1000);
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
    <div className="fixed inset-0 overflow-hidden">
      {/* Camera & Safety Monitor - Full Screen */}
      <ContinuousMonitoring ref={monitorRef} onSceneDescription={handleSceneDescription} />
      
      {/* Hidden Voice Controls - Always Listening */}
      <VoiceControls onCommand={handleVoiceCommand} />
    </div>
  );
};

export default Index;
