import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { parseMapDescription } from '@/lib/mapRequestParser';
import OpenAI from 'openai';

interface MapVisualizationProps {
  data: MapData | null;
}

const fuzzyMatchCountry = async (userInput: string, geoName: string): Promise<boolean> => {
  if (!userInput || !geoName) return false;
  
  try {
    const openai = new OpenAI({
      apiKey: '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',
      dangerouslyAllowBrowser: true
    });

    const prompt = `Are "${userInput}" and "${geoName}" referring to the same country/region? Answer with just "true" or "false".
    Examples:
    - "USA" and "United States" -> true
    - "UK" and "United Kingdom" -> true
    - "America" and "United States" -> true
    - "Britain" and "United Kingdom" -> true
    - "US" and "United States" -> true
    - "Australia" and "Australia" -> true
    - "France" and "Germany" -> false`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a geography expert. Respond with only 'true' or 'false'." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 5
    });

    const result = completion.choices[0]?.message?.content?.toLowerCase().includes('true') || false;
    
    console.log('Fuzzy matching:', { 
      userInput, 
      geoName, 
      match: result 
    });
    
    return result;
  } catch (error) {
    console.error('Error in fuzzy matching:', error);
    // Fallback to simple matching if API fails
    return userInput.toLowerCase().trim() === geoName.toLowerCase().trim();
  }
};

const MapVisualization = ({ data }: MapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) {
      console.log('No data or SVG ref available');
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 960;
    const height = 600;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("style", "max-width: 100%; height: auto;");

    // Check if any state name matches a US state name pattern
    const usStatePattern = /^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$/i;
    
    const isUSMap = data.states.some(s => usStatePattern.test(s.state));
    console.log('Map type:', isUSMap ? 'US Map' : 'World Map');
    console.log('Data states:', data.states);

    const projection = isUSMap 
      ? d3.geoAlbersUsa()
          .scale(1000)
          .translate([width / 2, height / 2])
      : d3.geoEqualEarth()
          .scale(180)
          .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const dataPromise = isUSMap
      ? Promise.all([
          d3.json("/geojson/US_states.geojson"),
          d3.json("/geojson/US_bounds.geojson")
        ])
      : Promise.all([
          d3.json("/geojson/countries.geojson"),
          d3.json("/geojson/country_bounds.geojson")
        ]);

    dataPromise.then(async ([regions, bounds]: [any, any]) => {
      // Create a map of country names to their colors
      const countryColors = new Map();
      data.states.forEach(state => {
        if (state.state.toLowerCase() === 'usa' || state.state.toLowerCase() === 'united states') {
          countryColors.set('United States', '#ef4444'); // Red for USA
        } else if (state.state.toLowerCase() === 'australia') {
          countryColors.set('Australia', '#3b82f6'); // Blue for Australia
        }
      });
      
      // Create an array to store all matching promises
      const matchPromises = regions.features.map(async (d: any) => {
        const geoName = d.properties.NAME || d.properties.name;
        const matches = await Promise.all(
          data.states.map(s => fuzzyMatchCountry(s.state, geoName))
        );
        return matches.some(match => match);
      });

      // Wait for all matching results
      const matchResults = await Promise.all(matchPromises);

      // Draw regions with the match results
      svg.append("g")
        .selectAll("path")
        .data(regions.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d: any) => {
          const geoName = d.properties.NAME || d.properties.name;
          return countryColors.get(geoName) || data.defaultFill || "#f3f3f3";
        })
        .attr("stroke", "white")
        .attr("stroke-width", "0.5");

      // Draw bounds
      svg.append("path")
        .datum(bounds)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", "1");

      // Update labels
      svg.append("g")
        .selectAll("text")
        .data(regions.features)
        .join("text")
        .attr("transform", (d: any) => {
          const centroid = path.centroid(d);
          return `translate(${centroid[0]},${centroid[1]})`;
        })
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text((d: any) => {
          const geoName = d.properties.NAME || d.properties.name;
          return countryColors.has(geoName) ? geoName : "";
        })
        .attr("fill", "#000000")
        .attr("font-size", "14px");

      // Add tooltips
      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "#ffffff")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

      svg.selectAll("path")
        .on("mouseover", (event, d: any) => {
          const geoName = d.properties?.NAME || d.properties?.name;
          tooltip
            .style("visibility", "visible")
            .html(`<strong>${geoName}</strong>`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("visibility", "hidden");
        });
    })
    .catch(error => {
      console.error('Error loading map data:', error);
    });

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [data]);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
};

export default MapVisualization;