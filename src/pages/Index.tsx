import { useState } from "react";
import MapForm from "@/components/MapGenerator/MapForm";
import MapVisualization from "@/components/MapGenerator/MapVisualization";
import { MapRequest, MapData } from "@/lib/types";
import { processExcelFile } from "@/lib/mapUtils";
import { generateMapInstructions } from "@/lib/llmMapGenerator";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleMapRequest = async (request: MapRequest) => {
    try {
      setIsLoading(true);
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
      } else if (request.apiKey) {
        // Use LLM to interpret the request
        console.log('Using LLM to interpret request');
        const llmMapData = await generateMapInstructions(request.description, request.apiKey);
        console.log('Setting LLM-generated map data:', llmMapData);
        setMapData(llmMapData);
      } else {
        // Fallback to simple parsing
        console.log('Using simple parser (no API key provided)');
        const states = request.description.match(/\b[A-Z]{2}\b/g) || [];
        const simpleMapData = {
          states: states.map(code => ({
            state: code,
            postalCode: code,
            sales: 100
          })),
          maxSales: 100,
          minSales: 0
        };
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
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'svg') => {
    console.log('Exporting map as:', format);
    const svgElement = document.querySelector('.map-visualization svg');
    if (!svgElement) {
      console.error('No SVG element found for export');
      toast({
        title: "Export Failed",
        description: "No SVG element found to export",
        variant: "destructive",
      });
      return;
    }

    // Clone the SVG to avoid modifying the displayed one
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Set explicit dimensions
    clonedSvg.setAttribute('width', '1200');
    clonedSvg.setAttribute('height', '800');
    
    // Ensure all styles are inlined
    const computedStyle = window.getComputedStyle(svgElement);
    clonedSvg.style.backgroundColor = computedStyle.backgroundColor;
    
    // Add XML declaration and SVG namespace
    const svgData = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
      new XMLSerializer().serializeToString(clonedSvg)
        .replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');

    // Create blob with proper SVG MIME type
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    
    // Check SVG data size
    if (blob.size < 1024) {
      console.error('Generated SVG is suspiciously small:', blob.size, 'bytes');
      toast({
        title: "Export Failed",
        description: "Generated SVG appears to be invalid",
        variant: "destructive",
      });
      return;
    }

    saveAs(blob, 'map-export.svg');
    toast({
      title: "Success",
      description: "Map exported successfully!",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Map Generator
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
            <MapForm onSubmit={handleMapRequest} />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <div className="text-center mb-4 text-lg font-semibold text-gray-600">
                  LOADING
                </div>
                <Skeleton className="h-[600px] w-full rounded-lg animate-pulse" />
                <div className="flex justify-end space-x-4">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ) : mapData && (
              <div className="map-visualization">
                <MapVisualization data={mapData} />
                <div className="flex justify-end mt-4">
                  <Button onClick={() => handleExport('svg')}>
                    Export SVG
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;