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
      console.log('Map container found:', mapContainer);
      
      if (!mapContainer) {
        throw new Error('Map container not found');
      }

      const svg = mapContainer.querySelector('svg');
      console.log('SVG element found:', svg);
      
      if (!svg) {
        throw new Error('SVG element not found');
      }

      // Log SVG dimensions and attributes
      console.log('SVG width:', svg.getAttribute('width'));
      console.log('SVG height:', svg.getAttribute('height'));
      console.log('SVG viewBox:', svg.getAttribute('viewBox'));

      if (format === 'svg') {
        // Clone the SVG to preserve all attributes and content
        const svgClone = svg.cloneNode(true) as SVGElement;
        
        // Ensure all required attributes are present
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgClone.setAttribute('width', svg.getAttribute('width') || '960');
        svgClone.setAttribute('height', svg.getAttribute('height') || '600');
        svgClone.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 960 600');
        
        // Get computed styles and apply them inline
        const svgElements = svgClone.getElementsByTagName('*');
        for (let i = 0; i < svgElements.length; i++) {
          const el = svgElements[i] as Element;
          const styles = window.getComputedStyle(svg.getElementsByTagName(el.tagName)[i]);
          let cssText = '';
          for (let j = 0; j < styles.length; j++) {
            const prop = styles[j];
            cssText += `${prop}:${styles.getPropertyValue(prop)};`;
          }
          (el as HTMLElement).style.cssText = cssText;
        }

        // Get the serialized SVG content
        const serializer = new XMLSerializer();
        const svgContent = serializer.serializeToString(svgClone);
        
        console.log('Final SVG content length:', svgContent.length);
        console.log('SVG content preview:', svgContent.substring(0, 200) + '...');
        
        // Check SVG size
        const svgSize = new Blob([svgContent]).size;
        console.log('SVG blob size:', svgSize, 'bytes');
        
        if (svgSize < 1024) {
          throw new Error(`Generated SVG is too small (${svgSize} bytes). Please try again.`);
        }
        
        // Create blob and download
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
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
        description: error instanceof Error ? error.message : "There was an error exporting the map. Please try again.",
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