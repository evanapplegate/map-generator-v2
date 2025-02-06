interface ParsedMapRequest {
  highlightedStates: string[];
  defaultFill: string;
  borderColor: string;
  labelColor: string;
}

export const parseMapDescription = (description: string): ParsedMapRequest => {
  const defaultSettings = {
    highlightedStates: [],
    defaultFill: "#22c55e", // Default to green-500
    borderColor: "white",
    labelColor: "black"
  };

  description = description.toLowerCase();

  // Extract state codes to highlight
  defaultSettings.highlightedStates = extractStateAbbreviations(description);
  
  return defaultSettings;
};

const extractStateAbbreviations = (text: string): string[] => {
  // Match 2-letter state codes
  const matches = text.toUpperCase().match(/\b[A-Z]{2}\b/g) || [];
  return [...new Set(matches)]; // Remove duplicates
};