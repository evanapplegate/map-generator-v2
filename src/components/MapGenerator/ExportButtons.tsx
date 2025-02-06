import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from 'file-saver';
import { useToast } from "@/components/ui/use-toast";
import html2pdf from 'html2pdf.js';

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

      if (format === 'svg') {
        // Create a deep clone of the SVG
        const svgClone = svg.cloneNode(true) as SVGElement;
        
        // Preserve the namespace
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Preserve dimensions
        svgClone.setAttribute('width', svg.getAttribute('width') || '960');
        svgClone.setAttribute('height', svg.getAttribute('height') || '600');
        svgClone.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 960 600');
        
        // Preserve all styles by copying them directly
        const allElements = Array.from(svg.getElementsByTagName('*'));
        const allClonedElements = Array.from(svgClone.getElementsByTagName('*'));
        
        allElements.forEach((el, index) => {
          const computedStyle = window.getComputedStyle(el);
          const clonedEl = allClonedElements[index];
          
          // Preserve fill colors and other important styles
          const importantStyles = [
            'fill',
            'stroke',
            'stroke-width',
            'opacity',
            'transform'
          ];
          
          importantStyles.forEach(style => {
            const value = computedStyle.getPropertyValue(style);
            if (value) {
              clonedEl.setAttribute(style, value);
            }
          });
        });

        // Serialize to string
        const serializer = new XMLSerializer();
        const svgContent = serializer.serializeToString(svgClone);
        
        // Verify size
        const svgSize = new Blob([svgContent]).size;
        console.log('SVG size:', svgSize, 'bytes');
        
        if (svgSize < 1024) {
          throw new Error(`Generated SVG is too small (${svgSize} bytes). Please try again.`);
        }
        
        // Create and save blob
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, 'world-sales-map.svg');
        
        toast({
          title: "Success",
          description: "Map exported successfully as SVG!",
        });
      } else if (format === 'pdf') {
        // PDF Export
        const element = mapContainer.cloneNode(true) as HTMLElement;
        
        const opt = {
          margin: 1,
          filename: 'world-sales-map.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        
        try {
          await html2pdf().set(opt).from(element).save();
          toast({
            title: "Success",
            description: "Map exported successfully as PDF!",
          });
        } catch (error) {
          throw new Error('PDF generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
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