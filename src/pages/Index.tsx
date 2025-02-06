import { useState } from "react";
import MapForm from "@/components/MapGenerator/MapForm";
import MapVisualization from "@/components/MapGenerator/MapVisualization";
import ExportButtons from "@/components/MapGenerator/ExportButtons";
import { MapRequest, MapData } from "@/lib/types";
import { processExcelFile } from "@/lib/mapUtils";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const { toast } = useToast();

  const handleMapRequest = async (request: MapRequest) => {
    try {
      if (!request.file) {
        toast({
          title: "Error",
          description: "Please upload a data file",
          variant: "destructive",
        });
        return;
      }

      const stateData = await processExcelFile(request.file);
      const sales = stateData.map(d => d.sales);
      
      setMapData({
        states: stateData,
        maxSales: Math.max(...sales),
        minSales: Math.min(...sales),
      });

      toast({
        title: "Success",
        description: "Map generated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process data file",
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
      // For PDF export, we'd need to add a PDF generation library
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
            Upload your sales data and generate a beautiful, interactive map
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
                  <ExportButtons onExport={handleExport} />
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