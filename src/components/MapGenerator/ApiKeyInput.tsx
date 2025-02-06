import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeyInput = ({ onKeySubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    onKeySubmit(key);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="apiKey">OpenAI API Key (optional)</Label>
      <Input
        id="apiKey"
        type="password"
        placeholder="sk-..."
        value={apiKey}
        onChange={handleChange}
        className="font-mono"
      />
      <p className="text-xs text-muted-foreground">
        Add your OpenAI API key to enable AI-powered map generation
      </p>
    </div>
  );
};

export default ApiKeyInput;