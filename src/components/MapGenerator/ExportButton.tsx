import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  format: 'svg' | 'pdf';
  onClick: () => void;
}

const ExportButton = ({ format, onClick }: ExportButtonProps) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="flex items-center gap-2"
  >
    <Download className="w-4 h-4" />
    Export {format.toUpperCase()}
  </Button>
);

export default ExportButton;