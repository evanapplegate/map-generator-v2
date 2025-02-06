import { useState } from "react";
import MapForm from "@/components/MapGenerator/MapForm";
import MapVisualization from "@/components/MapGenerator/MapVisualization";
import { MapRequest, MapData } from "@/lib/types";
import { processExcelFile } from "@/lib/mapUtils";
import { useToast } from "@/components/ui/use-toast";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";

const parseSimpleMapRequest = (description: string): MapData => {
  console.log('Parsing simple map request:', description);
  
  // Extract state codes (2 letter codes)
  const stateMatches: string[] = description.match(/\b[A-Z]{2}\b/g) || [];
  console.log('Matched state codes:', stateMatches);
  
  // Only create state data for matched states
  const states = stateMatches.map(code => {
    const stateNames: Record<string, string> = {
      'CA': 'California',
      'NY': 'New York',
      'TX': 'Texas',
      'CT': 'Connecticut',
      'MT': 'Montana'
    };
    
    return {
      state: stateNames[code] || code,
      postalCode: code,
      sales: 100 // Will be colored red
    };
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
      console.log('Handling map request:', request);
      if (request.file) {
        // Handle data-driven map
        console.log('Processing file-based request');
        const stateData = await processExcelFile(request.file);
        const sales = stateData.map(d => d.sales);
        
        const newMapData = {
          states: stateData,
          maxSales: Math.max(...sales),
          minSales: Math.min(...sales),
        };
        console.log('Setting new map data:', newMapData);
        setMapData(newMapData);
      } else {
        // Handle simple text-based map
        console.log('Processing text-based request');
        const simpleMapData = parseSimpleMapRequest(request.description);
        console.log('Setting simple map data:', simpleMapData);
        setMapData(simpleMapData);
      }

      toast({
        title: "Success",
        description: "Map generated successfully!",
      });
    } catch (error) {
      console.error('Error handling map request:', error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    }
  };

  const handleExport = (format: 'svg' | 'pdf') => {
    console.log('Exporting map as:', format);
    const svg = document.querySelector('svg');
    if (!svg) {
      console.error('No SVG element found for export');
      return;
    }

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
            US Sales Map Generator
          </h1>
          <p className="text-lg text-gray-600">
            Upload your sales data or describe your map requirements
          </p>
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
