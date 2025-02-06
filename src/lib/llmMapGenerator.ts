import OpenAI from 'openai';
import { MapData } from './types';

const getSystemPrompt = (variationIndex: number) => {
  const basePrompt = `You are a D3.js map visualization expert. Convert the user's map request into specific D3 visualization instructions.
For world maps (when countries are mentioned), use countries.geojson for country polygons and country_bounds.geojson for national boundaries.
For US maps (when US states are mentioned), use US_states.geojson for state polygons and US_bounds.geojson for national boundaries.

RESPOND ONLY WITH A VALID JSON OBJECT. NO OTHER TEXT OR FORMATTING.`;

  const variations = [
    "Use vibrant, high-contrast colors for highlighting.",
    "Use pastel, soft colors for a gentle appearance.",
  ];

  return `${basePrompt}
${variations[variationIndex]}
The JSON must follow this exact format:
{
  "states": [
    { "state": "stateName", "postalCode": "stateCode" }
  ],
  "defaultFill": "#hexColor",
  "highlightColors": {
    "stateCode": "#hexColor",
    "stateCode2": "#hexColor"
  },
  "borderColor": "#hexColor"
}`;
};

const validateResponse = async (jsonResponse: any, userRequest: string, apiKey: string) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const validationPrompt = `You are a data validation expert. Compare this JSON response with the GeoJSON fields and the original user request.
Original request: "${userRequest}"

JSON response:
${JSON.stringify(jsonResponse, null, 2)}

Check if:
1. All state codes in highlightColors match valid US state postal codes
2. All colors are valid hex codes
3. All requested states from the user's description are included
4. The color scheme matches what was requested

Respond with ONLY a JSON object in this format:
{
  "isValid": boolean,
  "issues": string[] (empty if valid),
  "suggestions": string[] (empty if valid)
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
    
    // Generate only 2 variations with different color schemes
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

        // Validate the response structure
        if (!parsedResponse.states || !Array.isArray(parsedResponse.states)) {
          console.error('Invalid response structure:', parsedResponse);
          throw new Error('Invalid response structure from OpenAI');
        }

        // Validate the response against GeoJSON and user requirements
        const validation = await validateResponse(parsedResponse, description, apiKey);
        console.log('Validation result:', validation);

        if (!validation.isValid) {
          console.error('Validation issues:', validation.issues);
          throw new Error(`Invalid map data: ${validation.issues.join(', ')}`);
        }

        // Convert the response to our MapData format
        return {
          states: parsedResponse.states.map((state: any) => ({
            state: state.state,
            postalCode: state.postalCode,
            sales: 100 // Default value for highlighting
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