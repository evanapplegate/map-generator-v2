
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput = ({ onApiKeyChange }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Notify parent of initial value
    onApiKeyChange(apiKey);
  }, [apiKey, onApiKeyChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="apiKey">Enter OpenAI API key</Label>
      <Input
        id="apiKey"
        type="password"
        placeholder="Enter your OpenAI API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full"
      />
      <p className="text-sm text-gray-500">
        Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI's dashboard</a>
      </p>
    </div>
  );
};

export default ApiKeyInput;
