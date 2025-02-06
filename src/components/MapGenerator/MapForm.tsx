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
          placeholder="Describe your map requirements..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-32"
        />
      </div>
      
      <FileUpload onFileSelect={(file) => setFile(file)} />
      
      <Button type="submit" className="w-full">
        Generate Map
      </Button>
    </form>
  );
};

export default MapForm;