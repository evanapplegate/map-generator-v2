import OpenAI from 'openai';
import { MapData } from './types';

const systemPrompt = `You are a D3.js map visualization expert. Convert the user's map request into specific D3 visualization instructions.
For world maps (when countries are mentioned), use countries.geojson for country polygons and country_bounds.geojson for national boundaries.
Return a JSON object with:
{
  "states": [
    { "state": "countryName", "postalCode": "countryCode" }
  ],
  "defaultFill": "#hexColor",
  "highlightColor": "#hexColor",
  "borderColor": "#hexColor"
}

For US maps (when US states are mentioned), use US_states.geojson for state polygons and US_bounds.geojson for national boundaries.
Return a JSON object with:
{
  "states": [
    { "state": "stateName", "postalCode": "stateCode" }
  ],
  "defaultFill": "#hexColor",
  "highlightColor": "#hexColor",
  "borderColor": "#hexColor"
}`;

export const generateMapInstructions = async (description: string, apiKey: string): Promise<MapData> => {
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
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: description }
      ],
      temperature: 0.2,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from OpenAI');

    console.log('OpenAI response:', response);
    const parsedResponse = JSON.parse(response);

    // Convert the response to our MapData format
    const mapData: MapData = {
      states: parsedResponse.states.map((state: any) => ({
        state: state.state,
        postalCode: state.postalCode,
        sales: 100 // Default value for highlighting
      })),
      maxSales: 100,
      minSales: 0,
      defaultFill: parsedResponse.defaultFill,
      borderColor: parsedResponse.borderColor,
      highlightColor: parsedResponse.highlightColor
    };

    console.log('Converted to MapData:', mapData);
    return mapData;
  } catch (error) {
    console.error('Error generating map instructions:', error);
    throw error;
  }
};