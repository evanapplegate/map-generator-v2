import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
}

const DEFAULT_API_KEY = "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";

const ApiKeyInput = ({ onKeySubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);

  // Submit the default key on component mount
  useState(() => {
    onKeySubmit(DEFAULT_API_KEY);
  });

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