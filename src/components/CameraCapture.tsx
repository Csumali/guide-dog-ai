import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onSceneDescription: (description: string) => void;
}

const CameraCapture = ({ onSceneDescription }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
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
      }
    } catch (error) {
      console.error("Error analyzing scene:", error);
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
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-4">
        {!isStreaming ? (
          <Button
            onClick={startCamera}
            size="lg"
            className="min-h-16 px-8 text-lg font-semibold"
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
              className="min-h-16 px-8 text-lg font-semibold"
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
              className="min-h-16 px-8 text-lg font-semibold"
            >
              Stop Camera
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
