interface ParsedMapRequest {
  highlightedStates: string[];
  defaultFill: string;
  borderColor: string;
  labelColor: string;
}

export const parseMapDescription = (description: string): ParsedMapRequest => {
  const defaultSettings = {
    highlightedStates: [],
    defaultFill: "#333333", // Dark gray default
    borderColor: "white",
    labelColor: "black"
  };

  description = description.toLowerCase();

  // Extract color information
  if (description.includes("blue")) {
    defaultSettings.highlightedStates = extractStateAbbreviations(description);
    return {
      ...defaultSettings,
      defaultFill: "#333333", // Dark gray for non-highlighted
      borderColor: "white",
      labelColor: "black"
    };
  }

  if (description.includes("red")) {
    defaultSettings.highlightedStates = extractStateAbbreviations(description);
    return {
      ...defaultSettings,
      defaultFill: "#333333", // Dark gray for non-highlighted
      borderColor: "white",
      labelColor: "black"
    };
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