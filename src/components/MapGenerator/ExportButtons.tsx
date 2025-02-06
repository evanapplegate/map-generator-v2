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
        // Create a new SVG element
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        
        // Create a clean SVG string with necessary attributes
        const cleanSvgString = svgString
          .replace(/(\w+)?:?xlink=/g, 'xlink=') // Fix xlink namespace
          .replace(/NS\d+:href/g, 'xlink:href') // Fix href namespace
          .replace(/\n/g, ' ') // Remove newlines
          .replace(/\s{2,}/g, ' ') // Remove extra spaces
          .replace(/<svg/, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="960" height="600"`);

        // Create a new document to properly handle SVG namespaces
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(cleanSvgString, 'image/svg+xml');
        const newSvg = svgDoc.documentElement;

        // Copy computed styles for each path
        const paths = svg.querySelectorAll('path');
        const newPaths = newSvg.querySelectorAll('path');
        paths.forEach((path, index) => {
          const computedStyle = window.getComputedStyle(path);
          const newPath = newPaths[index];
          if (newPath) {
            newPath.setAttribute('fill', computedStyle.fill);
            newPath.setAttribute('stroke', computedStyle.stroke);
            newPath.setAttribute('stroke-width', computedStyle.strokeWidth);
          }
        });

        // Serialize back to string with proper formatting
        const finalSvgString = serializer.serializeToString(newSvg);
        const blob = new Blob([finalSvgString], { type: 'image/svg+xml;charset=utf-8' });
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