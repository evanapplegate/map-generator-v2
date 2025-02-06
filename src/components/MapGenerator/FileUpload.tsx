import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">Upload Data File (Excel/CSV)</Label>
      <Input
        id="file-upload"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="cursor-pointer"
      />
    </div>
  );
};

export default FileUpload;