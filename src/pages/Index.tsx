import { useState } from "react";
import MapForm from "@/components/MapGenerator/MapForm";
import MapVisualization from "@/components/MapGenerator/MapVisualization";
import { MapRequest, MapData } from "@/lib/types";
import { processExcelFile } from "@/lib/mapUtils";
import { useToast } from "@/components/ui/use-toast";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";

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
    // Add more states as needed
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
  const { toast } = useToast();

  const handleMapRequest = async (request: MapRequest) => {
    try {
      if (request.file) {
        // Handle data-driven map
        const stateData = await processExcelFile(request.file);
        const sales = stateData.map(d => d.sales);
        
        setMapData({
          states: stateData,
          maxSales: Math.max(...sales),
          minSales: Math.min(...sales),
        });
      } else {
        // Handle simple text-based map
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

  const handleExport = (format: 'svg' | 'pdf') => {
    const svg = document.querySelector('svg');
    if (!svg) return;

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      saveAs(blob, 'us-sales-map.svg');
    } else {
      toast({
        title: "Coming Soon",
        description: "PDF export will be available in the next update!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Map Generator
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
            <MapForm onSubmit={handleMapRequest} />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {mapData && (
              <>
                <MapVisualization data={mapData} />
                <div className="flex justify-end">
                  <div className="space-x-4">
                    <Button onClick={() => handleExport('svg')}>
                      Export SVG
                    </Button>
                    <Button onClick={() => handleExport('pdf')}>
                      Export PDF
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;