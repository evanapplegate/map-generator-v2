import OpenAI from 'openai';
import { MapData } from './types';

const getSystemPrompt = (variationIndex: number) => {
  const basePrompt = `You are a D3.js map visualization expert. Convert the user's map request into specific D3 visualization instructions.
For world maps (when countries are mentioned), use countries.geojson for country polygons and country_bounds.geojson for national boundaries.
For US maps (when US states are mentioned), use US_states.geojson for state polygons and US_bounds.geojson for national boundaries.

RESPOND ONLY WITH A VALID JSON OBJECT. NO OTHER TEXT OR FORMATTING.

The JSON must follow this exact format for world maps:
{
  "mapType": "world",
  "states": [
    { 
      "state": "countryName", 
      "postalCode": "ISO3",
      "label": "Display Name"
    }
  ],
  "defaultFill": "#hexColor",
  "highlightColors": {
    "ISO3": "#hexColor"
  },
  "borderColor": "#hexColor",
  "showLabels": true
}

For US maps, use this format with 2-letter state codes:
{
  "mapType": "us",
  "states": [
    { 
      "state": "stateName", 
      "postalCode": "ST",
      "label": "Display Name"
    }
  ],
  "defaultFill": "#hexColor",
  "highlightColors": {
    "ST": "#hexColor"
  },
  "borderColor": "#hexColor",
  "showLabels": true
}`;

  const variations = [
    "Use exact colors as specified in the request.",
    "Use the same colors but at 80% opacity for a softer look.",
  ];

  return `${basePrompt}\n${variations[variationIndex]}`;
};

const validateResponse = async (jsonResponse: any, userRequest: string, apiKey: string) => {
  // Simple validation to check if the response has the required structure for D3
  const requiredFields = ['mapType', 'states', 'defaultFill', 'highlightColors', 'showLabels'];
  const hasRequiredFields = requiredFields.every(field => jsonResponse.hasOwnProperty(field));
  
  if (!hasRequiredFields) {
    return { 
      isValid: false, 
      issues: ['Response missing required fields for D3 visualization']
    };
  }

  // Check if states array is not empty and has required properties
  const hasValidStates = jsonResponse.states.length > 0 && 
    jsonResponse.states.every((state: any) => 
      state.state && state.postalCode && state.label
    );

  if (!hasValidStates) {
    return {
      isValid: false,
      issues: ['Invalid or missing state data']
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
            { role: "system", content: getSystemPrompt(index) },
            { role: "user", content: description }
          ],
          temperature: 0.8,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          console.error('Empty response from OpenAI');
          throw new Error('No response from OpenAI');
        }

        console.log(`OpenAI raw response for variation ${index}:`, response);
        
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(response);
          console.log(`Parsed response for variation ${index}:`, parsedResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Invalid JSON response:', response);
          throw new Error('Invalid JSON response from OpenAI');
        }

        const validation = await validateResponse(parsedResponse, description, apiKey);
        console.log('Validation result:', validation);

        if (!validation.isValid) {
          console.error('Validation issues:', validation.issues);
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
          borderColor: parsedResponse.borderColor,
          highlightColors: parsedResponse.highlightColors,
          showLabels: parsedResponse.showLabels
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