import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Navigation, MapPin, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { speak } from "@/utils/textToSpeech";

interface Step {
  instruction: string;
  html_instructions: string;
  distance: { text: string };
  duration: { text: string };
  maneuver?: string;
}

interface NavigationInterfaceProps {
  onNavigationStart: (destination: string) => void;
}

const NavigationInterface = ({ onNavigationStart }: NavigationInterfaceProps) => {
  const [destination, setDestination] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('Location acquired:', position.coords);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location access denied",
            description: "Please enable location services for navigation",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  const startNavigation = async () => {
    if (!destination.trim()) {
      toast({
        title: "Enter destination",
        description: "Please enter a destination to navigate to",
        variant: "destructive",
      });
      return;
    }

    if (!currentLocation) {
      toast({
        title: "Location unavailable",
        description: "Waiting for GPS location...",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    onNavigationStart(destination);

    try {
      const origin = `${currentLocation.lat},${currentLocation.lng}`;
      
      console.log('Requesting directions...');
      const { data, error } = await supabase.functions.invoke('get-directions', {
        body: { 
          origin,
          destination,
          mode: 'walking'
        }
      });

      if (error) throw error;

      if (data?.routes?.[0]?.legs?.[0]?.steps) {
        const navigationSteps = data.routes[0].legs[0].steps;
        setSteps(navigationSteps);
        setCurrentStepIndex(0);
        setIsNavigating(true);

        const firstStep = navigationSteps[0];
        const announcement = `Starting navigation to ${destination}. ${stripHtml(firstStep.html_instructions)}. Distance: ${firstStep.distance.text}`;
        speak(announcement, 0.9);

        toast({
          title: "Navigation started",
          description: `Route to ${destination} calculated`,
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation failed",
        description: error instanceof Error ? error.message : "Could not get directions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setSteps([]);
    setCurrentStepIndex(0);
    speak("Navigation stopped", 0.9);
  };

  const nextStep = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      const step = steps[newIndex];
      speak(`${stripHtml(step.html_instructions)}. Distance: ${step.distance.text}`, 0.9);
    } else {
      speak("You have arrived at your destination", 0.9);
      
      // Arrival haptic pattern
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      
      stopNavigation();
    }
  };

  const repeatStep = () => {
    if (steps[currentStepIndex]) {
      const step = steps[currentStepIndex];
      speak(`${stripHtml(step.html_instructions)}. Distance: ${step.distance.text}`, 0.9);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Navigation className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">Navigation</h2>
      </div>

      {!isNavigating ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {currentLocation ? (
              <span>Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
            ) : (
              <span>Acquiring location...</span>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter destination address..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startNavigation()}
              className="text-lg p-6"
            />
          </div>

          <Button
            onClick={startNavigation}
            disabled={isLoading || !currentLocation}
            size="lg"
            className="w-full min-h-16 text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Getting Directions...
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-6 w-6" />
                Start Navigation
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-primary mt-1" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {stripHtml(steps[currentStepIndex]?.html_instructions || '')}
                </p>
                <p className="text-lg text-muted-foreground mt-2">
                  {steps[currentStepIndex]?.distance.text} • {steps[currentStepIndex]?.duration.text}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={repeatStep}
              variant="secondary"
              size="lg"
              className="flex-1 min-h-14 text-lg"
            >
              Repeat
            </Button>
            <Button
              onClick={nextStep}
              size="lg"
              className="flex-1 min-h-14 text-lg font-semibold"
            >
              Next Step
            </Button>
          </div>

          <Button
            onClick={stopNavigation}
            variant="destructive"
            size="lg"
            className="w-full min-h-14 text-lg"
          >
            Stop Navigation
          </Button>
        </div>
      )}
    </Card>
  );
};

export default NavigationInterface;
