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
      // Wait a brief moment to ensure the map is fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      const svg = document.querySelector('.map-visualization svg');
      if (!svg) {
        throw new Error('SVG element not found');
      }

      if (format === 'svg') {
        // Clone the SVG to avoid modifying the displayed one
        const clonedSvg = svg.cloneNode(true) as SVGElement;
        
        // Ensure viewBox and dimensions are preserved
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
          clonedSvg.setAttribute('viewBox', viewBox);
        }
        
        // Set explicit width and height
        clonedSvg.setAttribute('width', '960');
        clonedSvg.setAttribute('height', '600');
        
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
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