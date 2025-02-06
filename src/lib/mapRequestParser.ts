interface ParsedMapRequest {
  highlightedStates: string[];
  defaultFill: string;
  borderColor: string;
  labelColor: string;
}

export const parseMapDescription = (description: string): ParsedMapRequest => {
  console.log('Parsing map description:', description);
  
  const defaultSettings = {
    highlightedStates: [],
    defaultFill: "#f3f3f3", // Light gray default
    borderColor: "white",
    labelColor: "black"
  };

  description = description.toLowerCase();
  console.log('Lowercased description:', description);

  // Extract color information for states
  if (description.includes("green")) {
    console.log('Found "green" in description, setting defaultFill to green');
    defaultSettings.defaultFill = "#22c55e"; // Using Tailwind's green-500
  } else {
    console.log('No color specified, using default light gray');
  }

  // Extract state codes to highlight
  defaultSettings.highlightedStates = extractStateAbbreviations(description);
  console.log('Extracted highlighted states:', defaultSettings.highlightedStates);
  
  console.log('Final parsed settings:', defaultSettings);
  return defaultSettings;
};

const extractStateAbbreviations = (text: string): string[] => {
  // Match 2-letter state codes
  const matches = text.toUpperCase().match(/\b[A-Z]{2}\b/g) || [];
  console.log('Found state codes in text:', matches);
  return [...new Set(matches)]; // Remove duplicates
};