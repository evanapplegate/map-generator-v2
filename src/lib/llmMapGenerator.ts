
import OpenAI from 'openai';
import { MapData } from './types';

const getSystemPrompt = () => {
  return `You are a D3.js map visualization expert. Convert the user's map request into specific D3 visualization instructions.
For world maps (when countries are mentioned), use countries.geojson with ISO3 codes.
For US maps (when US states are mentioned), use US states with 2-letter postal codes.

RESPOND ONLY WITH A VALID JSON OBJECT. NO OTHER TEXT OR FORMATTING.

The JSON must follow this format:
{
  "mapType": "world" | "us",
  "states": [
    { 
      "state": "regionName", 
      "postalCode": "stateCode | ISO3",
      "label": "Display Name"
    }
  ],
  "defaultFill": "#hexColor",
  "highlightColors": {
    "stateCode | ISO3": "#hexColor"
  },
  "showLabels": true
}`;
};

const validateResponse = (jsonResponse: any): { isValid: boolean; issues: string[] } => {
  // Basic structure validation
  const requiredFields = ['mapType', 'states', 'defaultFill', 'highlightColors', 'showLabels'];
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
    throw new Error('OpenAI API key required for map generation');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    console.log('Sending request to OpenAI:', description);
    
    const variations = await Promise.all([0, 1].map(async (index) => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: getSystemPrompt() },
            { role: "user", content: description }
          ],
          temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response from OpenAI');
        }

        console.log(`OpenAI raw response for variation ${index}:`, response);
        
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(response);
          console.log(`Parsed response for variation ${index}:`, parsedResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON response from OpenAI');
        }

        const validation = validateResponse(parsedResponse);
        if (!validation.isValid) {
          throw new Error(`Invalid map data: ${validation.issues.join(', ')}`);
        }

        return {
          states: parsedResponse.states.map((state: any) => ({
            state: state.state,
            postalCode: state.postalCode,
            label: state.label,
            sales: 100
          })),
          maxSales: 100,
          minSales: 0,
          defaultFill: parsedResponse.defaultFill,
          borderColor: parsedResponse.borderColor || '#ffffff',
          highlightColors: parsedResponse.highlightColors,
          showLabels: parsedResponse.showLabels,
          mapType: parsedResponse.mapType // Add this line to include the mapType
        };
      } catch (variationError) {
        console.error(`Error generating variation ${index}:`, variationError);
        throw variationError;
      }
    }));

    console.log('Generated map variations:', variations);
    return variations;
  } catch (error) {
    console.error('Error in generateMapInstructions:', error);
    throw error;
  }
};

