import { useState } from "react";
import { Card } from "@/components/ui/card";
import CameraCapture from "@/components/CameraCapture";
import VoiceControls from "@/components/VoiceControls";
import { speak } from "@/utils/textToSpeech";
import { Eye } from "lucide-react";

const Index = () => {
  const [sceneDescription, setSceneDescription] = useState<string>("");

  const handleSceneDescription = (description: string) => {
    setSceneDescription(description);
    speak(description);
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes("what") && lowerCommand.includes("see")) {
      speak("Please use the Describe Scene button to analyze your surroundings");
    } else if (lowerCommand.includes("help")) {
      speak("I can describe what your camera sees. Point your camera at your surroundings and tap Describe Scene.");
    } else {
      speak("I heard: " + command + ". Use the Describe Scene button to analyze your view.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Eye className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">PathGuide AI</h1>
          </div>
          <p className="text-2xl text-muted-foreground">
            Your AI navigation companion
          </p>
        </header>

        {/* Main Content */}
        <Card className="p-6 md:p-8 space-y-8">
          <CameraCapture onSceneDescription={handleSceneDescription} />
          
          <div className="flex justify-center">
            <VoiceControls onCommand={handleVoiceCommand} />
          </div>

          {sceneDescription && (
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Scene Description:</h2>
              <p className="text-lg text-foreground leading-relaxed">
                {sceneDescription}
              </p>
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-card/50">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">How to Use:</h2>
          <ul className="space-y-3 text-lg text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Tap "Start Camera" to activate your device camera</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Point camera at your surroundings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Tap "Describe Scene" to hear what's around you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              <span>Use "Voice Command" for hands-free interaction</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Index;
