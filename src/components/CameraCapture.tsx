import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onSceneDescription: (description: string) => void;
}

export interface CameraCaptureRef {
  captureAndAnalyze: () => void;
}

const CameraCapture = forwardRef<CameraCaptureRef, CameraCaptureProps>(({ onSceneDescription }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    captureAndAnalyze
  }));

  const startCamera = async () => {
    try {
      // Request camera with mobile-optimized settings
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
        setIsStreaming(true);
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        toast({
          title: "Camera active",
          description: "Point your camera to analyze surroundings",
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use PathGuide AI",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }

    setIsAnalyzing(true);
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
        onSceneDescription(data.description);
        
        // Success haptic
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
      }
    } catch (error) {
      console.error("Error analyzing scene:", error);
      
      // Error haptic
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      toast({
        title: "Analysis failed",
        description: "Could not analyze the scene. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden touch-none">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {!isStreaming ? (
          <Button
            onClick={startCamera}
            size="lg"
            className="min-h-16 px-8 text-lg font-semibold w-full active:scale-95 transition-transform"
          >
            <Camera className="mr-2 h-6 w-6" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              onClick={captureAndAnalyze}
              disabled={isAnalyzing}
              size="lg"
              className="min-h-16 px-8 text-lg font-semibold flex-1 active:scale-95 transition-transform"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Describe Scene"
              )}
            </Button>
            <Button
              onClick={stopCamera}
              variant="secondary"
              size="lg"
              className="min-h-16 px-8 text-lg font-semibold flex-1 sm:flex-initial active:scale-95 transition-transform"
            >
              Stop Camera
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

CameraCapture.displayName = "CameraCapture";

export default CameraCapture;
