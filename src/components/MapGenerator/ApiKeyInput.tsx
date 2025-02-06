import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";

interface ApiKeyInputProps {
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput = ({ onApiKeyChange }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState('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');

  useEffect(() => {
    // Notify parent of initial value
    onApiKeyChange(apiKey);
  }, [apiKey, onApiKeyChange]);

  return (
    <div className="space-y-2">
      <Input
        type="password"
        placeholder="Enter your OpenAI API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full"
      />
    </div>
  );
};

export default ApiKeyInput;