import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { parseMapDescription } from '@/lib/mapRequestParser';
import OpenAI from 'openai';

interface MapVisualizationProps {
  data: MapData | null;
}

const fuzzyMatchCountry = async (userInput: string, geoFeature: any): Promise<{ isMatch: boolean; color?: string }> => {
  if (!userInput || !geoFeature) return { isMatch: false };
  
  try {
    const openai = new OpenAI({
      apiKey: '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',
      dangerouslyAllowBrowser: true
    });

    const geoName = geoFeature.properties.NAME || geoFeature.properties.name;
    const geoProperties = JSON.stringify(geoFeature.properties);

    const prompt = `Analyze if the user's input "${userInput}" refers to the same geographic region as this GeoJSON feature:
    ${geoProperties}

    If it's a match, respond with a JSON object: 
    {
      "isMatch": true,
      "color": "<color>" // Use #ef4444 for USA/United States, #3b82f6 for Australia, or null for other matches
    }
    
    If it's not a match, respond with: {"isMatch": false}

    Examples of matches:
    - "USA", "US", "United States", "America" all match with a feature named "United States"
    - "UK", "Britain", "United Kingdom" all match with "United Kingdom"
    - "Australia" matches with "Australia"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a geography expert. Respond only with the JSON object as specified." },
        { role: "user", content: prompt }
      ],
      temperature: 0
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"isMatch": false}');
    
    console.log('Fuzzy matching:', { 
      userInput, 
      geoName,
      result
    });
    
    return result;
  } catch (error) {
    console.error('Error in fuzzy matching:', error);
    return { isMatch: false };
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
      // Create an array to store all matching promises
      const matchPromises = regions.features.map(async (feature: any) => {
        const matches = await Promise.all(
          data.states.map(async (s) => {
            const result = await fuzzyMatchCountry(s.state, feature);
            return result;
          })
        );
        return matches.find(m => m.isMatch) || { isMatch: false };
      });

      // Wait for all matching results
      const matchResults = await Promise.all(matchPromises);

      // Draw regions with the match results
      svg.append("g")
        .selectAll("path")
        .data(regions.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d: any, i: number) => {
          return matchResults[i].isMatch 
            ? (matchResults[i].color || data.highlightColor || "#ef4444")
            : (data.defaultFill || "#f3f3f3");
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
        .text((d: any, i: number) => {
          const geoName = d.properties.NAME || d.properties.name;
          return matchResults[i].isMatch ? geoName : "";
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