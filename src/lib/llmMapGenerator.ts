import { MapData } from './types';

const getSystemPrompt = () => {
  return `You are a D3.js map visualization expert. Create map visualizations based on the user's request.

For each region mentioned, use these EXACT property mappings:

FOR WORLD MAPS (countries):
- Use the ISO3 codes from countries.geojson
- Example country codes: USA, GBR, FRA, DEU, JPN, etc.
- Region properties structure in geojson:
  {
    "properties": {
      "name": "United States",
      "iso_a3": "USA"
    }
  }

FOR US MAPS (states):
- Use 2-letter postal codes from US_states.geojson
- Example state codes: CA, NY, TX, FL, etc.
- Region properties structure in geojson:
  {
    "properties": {
      "name": "California",
      "postal": "CA"
    }
  }

COLOR PREFERENCES:
- Default fill color should be "#edded1" unless specified
- Default border color should be "#ffffff"
- Colors should be gentle pastels, relatively unsaturated but still diffentiable by uhhh whatever would look good in 1977 Sunset mag

RESPOND ONLY WITH A VALID JSON OBJECT. NO OTHER TEXT OR FORMATTING.

The JSON must follow this format:
{
  "mapType": "world" | "us",
  "states": [
    {
      "state": "Full Name (e.g. 'California' or 'United States')",
      "postalCode": "Exact code from geojson (e.g. 'CA' or 'USA')",
      "label": "Display Name"
    }
  ],
  "defaultFill": "#hexColor",
  "highlightColors": {
    "postalCode": "#hexColor"
  },
  "borderColor": "#hexColor",
  "showLabels": true
}

Examples:
For US: { "state": "California", "postalCode": "CA", "label": "California" }
For World: { "state": "United States", "postalCode": "USA", "label": "United States" }`;
};

const validateResponse = (jsonResponse: any): { isValid: boolean; issues: string[] } => {
  // Basic structure validation
  const requiredFields = ['mapType', 'states', 'defaultFill', 'highlightColors', 'borderColor', 'showLabels'];
  if (!requiredFields.every(field => jsonResponse.hasOwnProperty(field))) {
    return { 
      isValid: false, 
      issues: ['Missing required fields']
    };
  }

  // Map type validation
  if (!['world', 'us'].includes(jsonResponse.mapType)) {
    return {
      isValid: false,
      issues: ['Invalid map type']
    };
  }

  // States array validation
  if (!Array.isArray(jsonResponse.states) || jsonResponse.states.length === 0) {
    return {
      isValid: false,
      issues: ['Invalid or empty states array']
    };
  }

  // State objects validation
  const hasValidStates = jsonResponse.states.every((state: any) => 
    state.state && 
    state.postalCode && 
    state.label &&
    typeof state.state === 'string' &&
    typeof state.postalCode === 'string' &&
    typeof state.label === 'string'
  );

  if (!hasValidStates) {
    return {
      isValid: false,
      issues: ['Invalid state data structure']
    };
  }

  // Validate postal codes based on map type
  const isValidPostalCode = (code: string, mapType: string) => {
    if (mapType === 'us') {
      return /^[A-Z]{2}$/.test(code);
    }
    return /^[A-Z]{3}$/.test(code);
  };

  const hasValidPostalCodes = jsonResponse.states.every((state: any) =>
    isValidPostalCode(state.postalCode, jsonResponse.mapType)
  );

  if (!hasValidPostalCodes) {
    return {
      isValid: false,
      issues: ['Invalid postal codes for map type']
    };
  }

  return { isValid: true, issues: [] };
};

export const generateMapInstructions = async (description: string, apiKey: string): Promise<MapData[]> => {
  if (!apiKey) {
    console.log('No API key provided');
    throw new Error('Claude API key required for map generation');
  }

  try {
    console.log('Sending request to Claude:', description);
    
    const variations = await Promise.all([0, 1].map(async (index) => {
      try {
        const response = await fetch('/api/claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey,
            system: getSystemPrompt(),
            messages: [
              { role: "user", content: description }
            ]
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Claude API error for variation ${index}:`, error);
          throw new Error(`Claude API error: ${error}`);
        }

        const data = await response.json();
        const content = data.content?.[0]?.text;
        if (!content) {
          throw new Error('No response from Claude');
        }

        console.log(`Claude raw response for variation ${index}:`, content);

        let jsonResponse;
        try {
          jsonResponse = JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse JSON from Claude response:', e);
          throw new Error('Invalid JSON response from Claude');
        }

        const validation = validateResponse(jsonResponse);
        if (!validation.isValid) {
          throw new Error(`Invalid response format: ${validation.issues.join(', ')}`);
        }

        return jsonResponse;
      } catch (error) {
        console.error(`Error generating variation ${index}:`, error);
        throw error;
      }
    }));

    return variations;
  } catch (error) {
    console.error('Error in generateMapInstructions:', error);
    throw error;
  }
};
