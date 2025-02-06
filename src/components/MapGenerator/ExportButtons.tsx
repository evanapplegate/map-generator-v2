import { useToast } from "@/components/ui/use-toast";
import { exportSVG, exportPDF } from "@/lib/exportUtils";
import ExportButton from "./ExportButton";

const ExportButtons = () => {
  const { toast } = useToast();

  const handleExport = async (format: 'svg' | 'pdf') => {
    try {
      const mapContainer = document.querySelector('.map-visualization');
      
      if (format === 'svg') {
        await exportSVG(mapContainer);
        toast({
          title: "Success",
          description: "Map exported successfully as SVG!",
        });
      } else {
        await exportPDF(mapContainer);
        toast({
          title: "Success",
          description: "Map exported successfully as PDF!",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "There was an error exporting the map. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-4">
      <ExportButton format="svg" onClick={() => handleExport('svg')} />
      <ExportButton format="pdf" onClick={() => handleExport('pdf')} />
    </div>
  );
};

export default ExportButtons;