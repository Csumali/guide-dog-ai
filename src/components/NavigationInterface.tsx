import { Card } from "@/components/ui/card";
import { Navigation, MapPin } from "lucide-react";

interface NavigationInterfaceProps {
  onNavigationStart: (destination: string) => void;
}

const NavigationInterface = ({ }: NavigationInterfaceProps) => {

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Navigation className="h-8 w-8 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Navigation</h2>
      </div>
      
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <MapPin className="h-5 w-5" />
        <p className="text-lg">Turn-by-turn navigation is not available in this version.</p>
      </div>
    </Card>
  );
};

export default NavigationInterface;
