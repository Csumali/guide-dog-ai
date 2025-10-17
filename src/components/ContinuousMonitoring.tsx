import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { speak, stopSpeaking } from "@/utils/textToSpeech";

interface ContinuousMonitoringProps {
  onSceneDescription?: (description: string) => void;
}

export interface ContinuousMonitoringRef {
  captureAndAnalyze: () => void;
  findObject: (searchQuery: string) => void;
}

const ContinuousMonitoring = forwardRef<ContinuousMonitoringRef, ContinuousMonitoringProps>(({ onSceneDescription }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastWarning, setLastWarning] = useState<string>("");
  const [avoidanceInstruction, setAvoidanceInstruction] = useState<string>("");
  const [threatLevel, setThreatLevel] = useState<"none" | "low" | "high">("none");
  const [searchTarget, setSearchTarget] = useState<string | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechRef = useRef<{ warning: string; distance: number; threatLevel: string; timestamp: number }>({ 
    warning: "", 
    distance: 0, 
    threatLevel: "none", 
    timestamp: 0 
  });
  const { toast } = useToast();

  const findObject = async (searchQuery: string) => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera not ready",
        description: "Please start the camera first",
        variant: "destructive",
      });
      return;
    }

    setSearchTarget(searchQuery);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const { data, error } = await supabase.functions.invoke('find-object', {
        body: { imageData, searchQuery }
      });

      if (error) throw error;

      if (data?.result) {
        speak(data.result);
      }
    } catch (error) {
      console.error("Error finding object:", error);
      speak("Sorry, I could not search for that right now");
    }
  };

  useImperativeHandle(ref, () => ({
    captureAndAnalyze,
    findObject
  }));

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        setIsMonitoring(true);

        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }

        speak("Continuous safety monitoring active", 0.9);
        
        // Start analyzing every 3 seconds
        monitoringIntervalRef.current = setInterval(() => {
          analyzeForHazards();
        }, 3000);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera access denied",
        description: "Continuous monitoring requires camera access",
        variant: "destructive",
      });
    }
  };

  const stopMonitoring = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    setIsMonitoring(false);
    setThreatLevel("none");
    setLastWarning("");
    stopSpeaking();
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera not ready",
        description: "Please start the camera first",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-scene', {
        body: { imageData }
      });

      if (error) throw error;

      if (data?.description) {
        onSceneDescription?.(data.description);
      }
    } catch (error) {
      console.error("Error analyzing scene:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the scene. Please try again.",
        variant: "destructive",
      });
    }
  };

  const analyzeForHazards = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.6);

    try {
      const { data, error } = await supabase.functions.invoke('detect-hazards', {
        body: { imageData, searchTarget }
      });

      if (error) throw error;

      if (data?.warning) {
        const threat = data.threatLevel || "low";
        setThreatLevel(threat);
        setLastWarning(data.warning);
        setAvoidanceInstruction(data.avoidance || "");

        // Check if target reached
        if (data.targetReached && searchTarget) {
          speak(`You've reached the ${searchTarget}`);
          setSearchTarget(null);
          return;
        }

        // If searching for object and we have guidance, speak it
        if (searchTarget && data.guidance) {
          speak(data.guidance, 1.0);
          return;
        }

        // Extract distance from warning (e.g., "Stairs 5 steps ahead" -> 5)
        const distanceMatch = data.warning.match(/(\d+)\s*(step|feet)/i);
        const currentDistance = distanceMatch ? parseInt(distanceMatch[1]) : 0;
        
        // Extract object type (first word before distance number)
        const objectMatch = data.warning.match(/^([A-Za-z\s]+?)\s*\d/);
        const currentObject = objectMatch ? objectMatch[1].trim() : data.warning;
        
        const now = Date.now();
        const timeSinceLastSpeech = now - lastSpeechRef.current.timestamp;
        const lastObject = lastSpeechRef.current.warning.match(/^([A-Za-z\s]+?)\s*\d/)?.[1]?.trim() || lastSpeechRef.current.warning;
        
        // Determine if we should speak based on smart throttling
        const shouldSpeak = 
          // First warning
          lastSpeechRef.current.timestamp === 0 ||
          // Different object detected
          currentObject !== lastObject ||
          // Threat level escalated
          (threat === "high" && lastSpeechRef.current.threatLevel !== "high") ||
          // Distance changed by 2+ steps and enough time passed (5s cooldown)
          (timeSinceLastSpeech >= 5000 && Math.abs(currentDistance - lastSpeechRef.current.distance) >= 2);

        if (shouldSpeak) {
          const message = data.avoidance 
            ? `${data.warning}. ${data.avoidance}` 
            : data.warning;
          speak(message, 1.0);
          
          // Update last speech tracking
          lastSpeechRef.current = {
            warning: data.warning,
            distance: currentDistance,
            threatLevel: threat,
            timestamp: now
          };
          
          // Urgent haptic pattern for high threats
          if ('vibrate' in navigator) {
            if (threat === "high") {
              navigator.vibrate([100, 50, 100, 50, 100]);
            } else {
              navigator.vibrate(100);
            }
          }
        }
      } else {
        setThreatLevel("none");
        setAvoidanceInstruction("");
      }
    } catch (error) {
      console.error("Error analyzing for hazards:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className={`p-4 ${threatLevel === "high" ? "border-destructive border-2" : threatLevel === "low" ? "border-accent" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${threatLevel === "high" ? "text-destructive" : threatLevel === "low" ? "text-accent" : "text-muted-foreground"}`} />
          <h3 className="text-lg font-semibold">Safety Monitor</h3>
        </div>
        {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-3 touch-none">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {threatLevel !== "none" && (
          <div className={`absolute top-2 left-2 right-2 ${threatLevel === "high" ? "bg-destructive" : "bg-accent"} text-white px-3 py-2 rounded-lg text-sm font-semibold`}>
            <div>{lastWarning}</div>
            {avoidanceInstruction && (
              <div className="text-xs mt-1 opacity-90">{avoidanceInstruction}</div>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={isMonitoring ? stopMonitoring : startMonitoring}
        variant={isMonitoring ? "destructive" : "default"}
        size="lg"
        className="w-full active:scale-95 transition-transform"
      >
        {isMonitoring ? (
          <>
            <EyeOff className="mr-2 h-5 w-5" />
            Stop Monitoring
          </>
        ) : (
          <>
            <Eye className="mr-2 h-5 w-5" />
            Start Safety Monitor
          </>
        )}
      </Button>
    </Card>
  );
});

export default ContinuousMonitoring;
