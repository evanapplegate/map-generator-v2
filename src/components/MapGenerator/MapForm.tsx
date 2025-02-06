import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FileUpload from "./FileUpload";
import ApiKeyInput from "./ApiKeyInput";
import { MapRequest } from "@/lib/types";

interface MapFormProps {
  onSubmit: (request: MapRequest) => void;
}

const MapForm = ({ onSubmit }: MapFormProps) => {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('MapForm - Submitting request:', { 
      description, 
      file: file?.name,
      hasApiKey: !!apiKey 
    });
    onSubmit({ description, file, apiKey });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ApiKeyInput onApiKeyChange={setApiKey} />
      
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
        <FileUpload onFileSelect={(file) => setFile(file)} />
      </div>
      
      <Button type="submit" className="w-full">
        Generate Map
      </Button>
    </form>
  );
};

export default MapForm;