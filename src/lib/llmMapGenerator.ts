import OpenAI from 'openai';
import { MapData } from './types';

const systemPrompt = `You are a D3.js map visualization expert. Convert the user's map request into specific D3 visualization instructions.
Return a JSON object with these properties:
- highlightedStates: array of state names to highlight
- defaultFill: hex color for non-highlighted states
- borderColor: hex color for state borders
- labeledStates: array of state postal codes to label
- highlightColor: hex color for highlighted states

Example:
User: "Make California and Texas red, other states gray"
Response: {
  "highlightedStates": ["California", "Texas"],
  "defaultFill": "#f3f3f3",
  "borderColor": "#ffffff",
  "labeledStates": ["CA", "TX"],
  "highlightColor": "#ef4444"
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
      model: "gpt-4",
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

    // Convert the LLM response into our MapData format
    const stateData = instructions.highlightedStates.map((state: string, index: number) => {
      // Find the postal code in labeledStates array
      const postalCode = instructions.labeledStates[index] || state.substring(0, 2).toUpperCase();
      return {
        state: state,
        postalCode: postalCode,
        sales: 100 // Using 100 as a default value for highlighted states
      };
    });

    console.log('Converted to MapData:', { states: stateData });

    return {
      states: stateData,
      maxSales: 100,
      minSales: 0,
      defaultFill: instructions.defaultFill,
      borderColor: instructions.borderColor,
      highlightColor: instructions.highlightColor
    };
  } catch (error) {
    console.error('Error generating map instructions:', error);
    throw error;
  }
};