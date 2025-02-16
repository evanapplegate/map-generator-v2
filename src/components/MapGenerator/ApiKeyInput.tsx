import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput = ({ onApiKeyChange }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState('fake-key');

  useEffect(() => {
    // Notify parent of initial value
    onApiKeyChange(apiKey);
  }, [apiKey, onApiKeyChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="apiKey">Enter Claude API key</Label>
      <Input
        id="apiKey"
        type="password"
        placeholder="Enter your Claude API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full"
      />
    </div>
  );
};

export default ApiKeyInput;