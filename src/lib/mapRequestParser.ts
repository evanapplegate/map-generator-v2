interface ParsedMapRequest {
  highlightedStates: string[];
  defaultFill: string;
  borderColor: string;
  labelColor: string;
}

export const parseMapDescription = (description: string): ParsedMapRequest => {
  const defaultSettings = {
    highlightedStates: [],
    defaultFill: "#f3f3f3", // Light gray default
    borderColor: "white",
    labelColor: "black"
  };

  description = description.toLowerCase();

  // Extract color information for states
  if (description.includes("green")) {
    defaultSettings.defaultFill = "#22c55e"; // Using Tailwind's green-500
  }

  // Extract state codes to highlight
  defaultSettings.highlightedStates = extractStateAbbreviations(description);
  
  return defaultSettings;
};

const extractStateAbbreviations = (text: string): string[] => {
  // Match 2-letter state codes
  const matches = text.toUpperCase().match(/\b[A-Z]{2}\b/g) || [];
  return [...new Set(matches)]; // Remove duplicates
};