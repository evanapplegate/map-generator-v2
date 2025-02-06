import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from 'file-saver';

interface ExportButtonsProps {
  onExport: (format: 'svg' | 'pdf') => void;
}

const ExportButtons = ({ onExport }: ExportButtonsProps) => {
  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={() => onExport('svg')}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export SVG
      </Button>
      <Button
        variant="outline"
        onClick={() => onExport('pdf')}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </Button>
    </div>
  );
};

export default ExportButtons;