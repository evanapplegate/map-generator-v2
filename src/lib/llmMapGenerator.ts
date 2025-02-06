import OpenAI from 'openai';
import { MapData } from './types';

const systemPrompt = `You are a D3.js map visualization expert. Convert the user's map request into specific D3 visualization instructions.
For world maps (when countries are mentioned), use countries.geojson for country polygons and country_bounds.geojson for national boundaries.
Return:
{
  "highlightedCountries": array of country names to highlight,
  "defaultFill": hex color for non-highlighted countries,
  "borderColor": hex color for country borders,
  "labeledCountries": array of country codes to label,
  "highlightColors": object mapping country names to their highlight colors
}

For US maps (when US states are mentioned), use US_states.geojson for state polygons and US_bounds.geojson for national boundaries.
Return:
{
  "highlightedStates": array of state names to highlight,
  "defaultFill": hex color for non-highlighted states,
  "borderColor": hex color for state borders,
  "labeledStates": array of state postal codes to label,
  "highlightColor": hex color for highlighted states
}`;

export const generateMapInstructions = async (description: string, apiKey: string): Promise<MapData> => {
  if (!apiKey) {
    console.log('No API key provided, using default parser');
    throw new Error('OpenAI API key required for AI-powered map generation');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Note: In production, calls should go through backend
  });

  try {
    console.log('Sending request to OpenAI:', description);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: description }
      ],
      temperature: 0.2,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from OpenAI');

    console.log('OpenAI response:', response);
    const instructions = JSON.parse(response);

    // Check if it's a world map request by looking for highlightedCountries
    const isWorldMap = 'highlightedCountries' in instructions;

    // Convert the LLM response into our MapData format
    const stateData = isWorldMap 
      ? instructions.highlightedCountries.map((country: string, index: number) => ({
          state: country,
          postalCode: instructions.labeledCountries[index] || country.substring(0, 3).toUpperCase(),
          sales: 100 // Using 100 as a default value for highlighted countries
        }))
      : instructions.highlightedStates.map((state: string, index: number) => ({
          state: state,
          postalCode: instructions.labeledStates[index] || state.substring(0, 2).toUpperCase(),
          sales: 100
        }));

    console.log('Converted to MapData:', { states: stateData });

    return {
      states: stateData,
      maxSales: 100,
      minSales: 0,
      defaultFill: instructions.defaultFill,
      borderColor: instructions.borderColor,
      highlightColor: isWorldMap 
        ? instructions.highlightColors[stateData[0]?.state] || '#ef4444'
        : instructions.highlightColor
    };
  } catch (error) {
    console.error('Error generating map instructions:', error);
    throw error;
  }
};