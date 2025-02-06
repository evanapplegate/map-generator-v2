import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FileUpload from "./FileUpload";
import { MapRequest } from "@/lib/types";

interface MapFormProps {
  onSubmit: (request: MapRequest) => void;
}

const MapForm = ({ onSubmit }: MapFormProps) => {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ description, file });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Map Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your map requirements... (e.g., 'USA map, light gray fill, white boundaries, label CA NY MT + make those states red')"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-32"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Optional: Upload sales data file</p>
        <FileUpload onFileSelect={(file) => setFile(file)} />
      </div>
      
      <Button type="submit" className="w-full">
        Generate Map
      </Button>
    </form>
  );
};

export default MapForm;