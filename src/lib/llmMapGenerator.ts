import OpenAI from 'openai';
import { MapData } from './types';

const getSystemPrompt = (variationIndex: number) => {
  const basePrompt = `You are a D3.js map visualization expert. Convert the user's map request into specific D3 visualization instructions.
For world maps (when countries are mentioned), use countries.geojson for country polygons and country_bounds.geojson for national boundaries.
For US maps (when US states are mentioned), use US_states.geojson for state polygons and US_bounds.geojson for national boundaries.

RESPOND ONLY WITH A VALID JSON OBJECT. NO OTHER TEXT OR FORMATTING.`;

  // Add variation-specific guidance
  const variations = [
    "Use vibrant, high-contrast colors for highlighting.",
    "Use pastel, soft colors for a gentle appearance.",
    "Use earth tones and natural colors.",
    "Use modern, tech-inspired colors (blues, cyans, etc)."
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
    
    // Generate 4 variations with different color schemes
    const variations = await Promise.all([0, 1, 2, 3].map(async (index) => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: getSystemPrompt(index) },
          { role: "user", content: description }
        ],
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      console.log(`OpenAI response for variation ${index}:`, response);
      
      const parsedResponse = JSON.parse(response);

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
        highlightColors: parsedResponse.highlightColors // Now using the object of colors
      };
    }));

    console.log('Generated map variations:', variations);
    return variations;
  } catch (error) {
    console.error('Error generating map instructions:', error);
    throw error;
  }
};