import { useState } from "react";
import { MapRequest, MapData } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { processExcelFile } from "@/lib/mapUtils";
import Header from "@/components/MapGenerator/Header";
import MapForm from "@/components/MapGenerator/MapForm";
import MapContainer from "@/components/MapGenerator/MapContainer";

const parseSimpleMapRequest = (description: string): MapData => {
  const defaultFill = "#f3f4f6"; // light gray
  const highlightColor = "#ef4444"; // red
  
  // Extract state codes (2 letter codes)
  const stateMatches: string[] = description.match(/\b[A-Z]{2}\b/g) || [];
  
  // Create base state data with explicit type
  const states: Array<{ state: string; postalCode: string; sales: number }> = [
    { state: "California", postalCode: "CA", sales: 0 },
    { state: "New York", postalCode: "NY", sales: 0 },
    { state: "Montana", postalCode: "MT", sales: 0 },
  ];

  // Highlight matched states
  states.forEach(state => {
    if (stateMatches.includes(state.postalCode)) {
      state.sales = 100; // Will be colored red
    } else {
      state.sales = 0; // Will use default fill
    }
  });

  return {
    states,
    maxSales: 100,
    minSales: 0
  };
};

const Index = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [detailLevel, setDetailLevel] = useState("110m");
  const { toast } = useToast();

  const handleMapRequest = async (request: MapRequest & { detailLevel: string }) => {
    try {
      setDetailLevel(request.detailLevel);
      if (request.file) {
        const stateData = await processExcelFile(request.file);
        const sales = stateData.map(d => d.sales);
        
        setMapData({
          states: stateData,
          maxSales: Math.max(...sales),
          minSales: Math.min(...sales),
        });
      } else {
        const simpleMapData = parseSimpleMapRequest(request.description);
        setMapData(simpleMapData);
      }

      toast({
        title: "Success",
        description: "Map generated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
            <MapForm onSubmit={handleMapRequest} />
          </div>
          <div className="lg:col-span-2">
            <MapContainer mapData={mapData} detailLevel={detailLevel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;