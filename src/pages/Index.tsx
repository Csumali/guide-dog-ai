import { useRef } from "react";
import VoiceControls from "@/components/VoiceControls";
import ContinuousMonitoring, { ContinuousMonitoringRef } from "@/components/ContinuousMonitoring";
import { speak } from "@/utils/textToSpeech";
import guidedogLogo from "@/assets/guidedog-logo.png";

const Index = () => {
  const monitorRef = useRef<ContinuousMonitoringRef>(null);

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
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Logo */}
      <header className="flex items-center justify-center p-4 bg-background border-b">
        <img src={guidedogLogo} alt="Guide Dog AI" className="h-12 object-contain" />
      </header>
      
      {/* Camera & Safety Monitor */}
      <div className="flex-1 overflow-hidden">
        <ContinuousMonitoring ref={monitorRef} />
      </div>
      
      {/* Hidden Voice Controls - Always Listening */}
      <VoiceControls onCommand={handleVoiceCommand} />
    </div>
  );
};

export default Index;
