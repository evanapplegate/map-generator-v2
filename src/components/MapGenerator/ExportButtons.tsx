import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from 'file-saver';
import { useToast } from "@/components/ui/use-toast";

interface ExportButtonsProps {
  onExport: (format: 'svg' | 'pdf') => void;
}

const ExportButtons = ({ onExport }: ExportButtonsProps) => {
  const { toast } = useToast();

  const handleExport = async (format: 'svg' | 'pdf') => {
    try {
      // Wait for map to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mapContainer = document.querySelector('.map-visualization');
      const svg = mapContainer?.querySelector('svg');
      
      if (!svg) {
        throw new Error('SVG element not found');
      }

      if (format === 'svg') {
        // Get the original SVG content directly
        const svgContent = svg.outerHTML;
        
        // Add required SVG namespace
        const svgWithNamespace = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        
        // Create blob and download
        const blob = new Blob([svgWithNamespace], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, 'world-sales-map.svg');
        
        toast({
          title: "Success",
          description: "Map exported successfully as SVG!",
        });
      } else {
        onExport(format);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the map. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={() => handleExport('svg')}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export SVG
      </Button>
      <Button
        variant="outline"
        onClick={() => handleExport('pdf')}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </Button>
    </div>
  );
};

export default ExportButtons;