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
    { "state": "countryName", "postalCode": "ISO3" }
  ],
  "defaultFill": "#hexColor",
  "highlightColors": {
    "ISO3": "#hexColor"
  },
  "borderColor": "#hexColor"
}

For US maps, use this format with 2-letter state codes:
{
  "mapType": "us",
  "states": [
    { "state": "stateName", "postalCode": "ST" }
  ],
  "defaultFill": "#hexColor",
  "highlightColors": {
    "ST": "#hexColor"
  },
  "borderColor": "#hexColor"
}`;

  const variations = [
    "Use vibrant, high-contrast colors for highlighting.",
    "Use pastel, soft colors for a gentle appearance.",
  ];

  return `${basePrompt}\n${variations[variationIndex]}`;
};

const validateResponse = async (jsonResponse: any, userRequest: string, apiKey: string) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const validationPrompt = `You are a data validation expert. Validate this map data against the user's requirements.
User request: "${userRequest}"

Map data:
${JSON.stringify(jsonResponse, null, 2)}

Validate:
1. Map type matches the request (world/us)
2. All requested locations are included with correct names and codes
3. Colors match specific requests (e.g., "blue USA" -> USA should be blue)
4. Required format elements are present (mapType, states, defaultFill, highlightColors)

Respond with ONLY a JSON object:
{
  "isValid": boolean,
  "issues": string[],
  "suggestions": string[]
}`;

  try {
    const validation = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: validationPrompt }
      ],
      temperature: 0.3,
    });

    const validationResponse = validation.choices[0]?.message?.content;
    if (!validationResponse) {
      console.error('Empty validation response');
      return { isValid: false, issues: ['Validation failed'] };
    }

    console.log('Validation response:', validationResponse);
    return JSON.parse(validationResponse);
  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: false, issues: ['Validation failed'] };
  }
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

        if (!parsedResponse.states || !Array.isArray(parsedResponse.states)) {
          console.error('Invalid response structure:', parsedResponse);
          throw new Error('Invalid response structure from OpenAI');
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
            sales: 100
          })),
          maxSales: 100,
          minSales: 0,
          defaultFill: parsedResponse.defaultFill,
          borderColor: parsedResponse.borderColor,
          highlightColors: parsedResponse.highlightColors
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