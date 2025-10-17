import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraCapture from "@/components/CameraCapture";
import VoiceControls from "@/components/VoiceControls";
import NavigationInterface from "@/components/NavigationInterface";
import { speak } from "@/utils/textToSpeech";
import { Eye, Navigation, Camera } from "lucide-react";

const Index = () => {
  const [sceneDescription, setSceneDescription] = useState<string>("");
  const [navigationDestination, setNavigationDestination] = useState<string>("");

  const handleSceneDescription = (description: string) => {
    setSceneDescription(description);
    const contextMessage = navigationDestination 
      ? `Navigating to ${navigationDestination}. ${description}`
      : description;
    speak(contextMessage);
  };

  const handleNavigationStart = (destination: string) => {
    setNavigationDestination(destination);
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes("navigate") || lowerCommand.includes("directions")) {
      speak("Switch to the Navigation tab to enter your destination");
    } else if (lowerCommand.includes("what") && lowerCommand.includes("see")) {
      speak("Please use the Describe Scene button to analyze your surroundings");
    } else if (lowerCommand.includes("help")) {
      speak("I can describe what your camera sees and provide navigation. Use the tabs to switch between modes.");
    } else {
      speak("I heard: " + command + ". Use tabs to switch between Scene Analysis and Navigation.");
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
        <Tabs defaultValue="scene" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-16">
            <TabsTrigger value="scene" className="text-lg gap-2">
              <Camera className="h-5 w-5" />
              Scene Analysis
            </TabsTrigger>
            <TabsTrigger value="navigation" className="text-lg gap-2">
              <Navigation className="h-5 w-5" />
              Navigation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scene" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="navigation">
            <NavigationInterface onNavigationStart={handleNavigationStart} />
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="p-6 bg-card/50">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">How to Use:</h2>
          <ul className="space-y-3 text-lg text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>Scene Analysis:</strong> Camera describes obstacles, landmarks, and safe paths</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>Navigation:</strong> Turn-by-turn GPS guidance to any destination</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>Voice Control:</strong> Hands-free commands and spoken feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>Accessibility:</strong> High contrast design optimized for low vision</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Index;
