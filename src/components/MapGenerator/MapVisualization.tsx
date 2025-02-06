import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { parseMapDescription } from '@/lib/mapRequestParser';
import { useToast } from '@/hooks/use-toast';

interface MapVisualizationProps {
  data: MapData | null;
}

const fuzzyMatchCountry = (userInput: string, geoFeature: any): { isMatch: boolean; color?: string } => {
  if (!userInput || !geoFeature) return { isMatch: false };
  
  try {
    const geoName = (geoFeature.properties.NAME || geoFeature.properties.name || '').toLowerCase();
    const searchTerm = userInput.toLowerCase();
    
    // Direct match
    if (geoName === searchTerm) {
      return { isMatch: true };
    }
    
    // Partial match
    if (geoName.includes(searchTerm) || searchTerm.includes(geoName)) {
      return { isMatch: true };
    }
    
    // Handle common abbreviations for US states
    const stateAbbreviations: { [key: string]: string } = {
      'ca': 'california',
      'ny': 'new york',
      'fl': 'florida',
      'tx': 'texas',
      // Add more as needed
    };
    
    if (stateAbbreviations[searchTerm] === geoName || 
        stateAbbreviations[geoName] === searchTerm) {
      return { isMatch: true };
    }

    return { isMatch: false };
  } catch (error) {
    console.error('Error in fuzzy matching:', error);
    return { isMatch: false };
  }
};

const MapVisualization = ({ data }: MapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

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

    const isUSMap = data.states.some(s => /^[A-Z]{2}$/.test(s.state));
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
      const matchResults = regions.features.map((feature: any) => {
        const matches = data.states.map(s => fuzzyMatchCountry(s.state, feature));
        return matches.find(m => m.isMatch) || { isMatch: false };
      });

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

      // Update labels - Only show labels for matched regions
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
          // Only show label if this region was explicitly matched
          if (!matchResults[i].isMatch) return "";
          const geoName = d.properties.NAME || d.properties.name;
          // Clean up the name by removing any extra text after dots or commas
          return geoName.split(/[.,]/)[0].trim();
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
      toast({
        title: "Error",
        description: "Failed to load map data",
        variant: "destructive"
      });
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