import { useState } from "react";
import MapForm from "@/components/MapGenerator/MapForm";
import MapVisualization from "@/components/MapGenerator/MapVisualization";
import { MapRequest, MapData } from "@/lib/types";
import { processExcelFile } from "@/lib/mapUtils";
import { generateMapInstructions } from "@/lib/llmMapGenerator";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { saveAs } from 'file-saver';

const Index = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleMapRequest = async (request: MapRequest) => {
    try {
      setIsLoading(true);
      console.log('Handling map request:', request);
      
      let newMapData: MapData;
      
      if (request.file) {
        // Handle data-driven map
        console.log('Processing file-based request');
        const stateData = await processExcelFile(request.file);
        const sales = stateData.map(d => d.sales);
        
        newMapData = {
          states: stateData,
          maxSales: Math.max(...sales),
          minSales: Math.min(...sales),
        };
      } else {
        // Use LLM to interpret the request
        console.log('Using LLM to interpret request');
        if (!request.apiKey) {
          throw new Error('OpenAI API key is required');
        }
        newMapData = await generateMapInstructions(request.description, request.apiKey);
      }

      console.log('Setting new map data:', newMapData);
      setMapData(newMapData);
      
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
    
    // Set explicit dimensions and viewBox
    clonedSvg.setAttribute('width', '1200');
    clonedSvg.setAttribute('height', '800');
    clonedSvg.setAttribute('viewBox', '0 0 960 600');
    
    // Clean up any invalid attributes
    clonedSvg.removeAttribute('style');
    Array.from(clonedSvg.querySelectorAll('*')).forEach(element => {
      if (element instanceof SVGElement) {
        // Remove empty transforms and undefined classes
        if (element.getAttribute('transform') === '') {
          element.removeAttribute('transform');
        }
        if (element.getAttribute('class') === '') {
          element.removeAttribute('class');
        }
      }
    });
    
    // Ensure proper SVG structure with all required namespaces
    const svgData = [
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
      '<svg',
      ' version="1.1"',
      ' xmlns="http://www.w3.org/2000/svg"',
      ' xmlns:xlink="http://www.w3.org/1999/xlink"',
      ' xmlns:ev="http://www.w3.org/2001/xml-events"',
      ` width="${clonedSvg.getAttribute('width')}"`,
      ` height="${clonedSvg.getAttribute('height')}"`,
      ` viewBox="${clonedSvg.getAttribute('viewBox')}"`,
      '>',
      clonedSvg.innerHTML,
      '</svg>'
    ].join('\n');

    // Create blob with proper SVG MIME type
    const blob = new Blob([svgData], { 
      type: 'image/svg+xml;charset=utf-8'
    });
    
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
                  Generating Map...
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

