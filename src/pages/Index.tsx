import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import CameraCapture, { CameraCaptureRef } from "@/components/CameraCapture";
import VoiceControls from "@/components/VoiceControls";
import NavigationInterface from "@/components/NavigationInterface";
import ContinuousMonitoring from "@/components/ContinuousMonitoring";
import { speak } from "@/utils/textToSpeech";
import { keepScreenAwake, detectMobileDevice } from "@/utils/mobileOptimizations";
import { Eye } from "lucide-react";

const Index = () => {
  const [sceneDescription, setSceneDescription] = useState<string>("");
  const [navigationDestination, setNavigationDestination] = useState<string>("");
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const cameraRef = useRef<CameraCaptureRef>(null);

  useEffect(() => {
    // Mobile optimizations
    if (detectMobileDevice()) {
      keepScreenAwake();
      console.log('Mobile device detected - optimizations enabled');
    }
  }, []);

  const handleSceneDescription = (description: string) => {
    setSceneDescription(description);
    const contextMessage = navigationDestination 
      ? `Navigating to ${navigationDestination}. ${description}`
      : description;
    speak(contextMessage);
  };

  const handleNavigationStart = (destination: string) => {
    setNavigationDestination(destination);
    setIsNavigationActive(true);
    speak(`Starting navigation to ${destination}. Safety monitor activated.`);
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Parse navigation commands
    if (lowerCommand.includes("start navigation") || lowerCommand.includes("navigate to")) {
      const destinationMatch = lowerCommand.match(/(?:navigate to|start navigation to|navigation to)\s+(.+)/i);
      if (destinationMatch && destinationMatch[1]) {
        const destination = destinationMatch[1].trim();
        handleNavigationStart(destination);
      } else {
        speak("Please specify a destination. Say 'start navigation to' followed by your destination.");
      }
    } 
    // Parse scene analysis commands
    else if (lowerCommand.includes("describe") || 
             lowerCommand.includes("what's in front") ||
             lowerCommand.includes("what is in front") ||
             lowerCommand.includes("whats in front") ||
             lowerCommand.includes("what do you see")) {
      speak("Analyzing scene now");
      cameraRef.current?.captureAndAnalyze();
    }
    // Stop navigation
    else if (lowerCommand.includes("stop navigation")) {
      setIsNavigationActive(false);
      setNavigationDestination("");
      speak("Navigation stopped");
    }
    // Help command
    else if (lowerCommand.includes("help")) {
      speak("Say 'start navigation to' followed by a destination, or say 'describe what's in front of me' for scene analysis.");
    } 
    // Unknown command
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

        {/* Navigation Interface - Show when active */}
        {isNavigationActive && (
          <NavigationInterface onNavigationStart={handleNavigationStart} />
        )}

        {/* Scene Analysis */}
        <Card className="p-6 md:p-8 space-y-8">
          <CameraCapture ref={cameraRef} onSceneDescription={handleSceneDescription} />

          {sceneDescription && (
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Scene Description:</h2>
              <p className="text-lg text-foreground leading-relaxed">
                {sceneDescription}
              </p>
            </div>
          )}
        </Card>

        {/* Safety Monitor - Always Available */}
        <ContinuousMonitoring isNavigating={isNavigationActive} />

        {/* Instructions */}
        <Card className="p-6 bg-card/50">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Voice Commands:</h2>
          <ul className="space-y-3 text-lg text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>"Start navigation to [destination]"</strong> - Activates GPS navigation and safety monitor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>"Describe what's in front of me"</strong> - Analyzes the current scene</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>"Stop navigation"</strong> - Ends active navigation</span>
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
