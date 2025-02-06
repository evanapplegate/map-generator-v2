import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { parseMapDescription } from '@/lib/mapRequestParser';

interface MapVisualizationProps {
  data: MapData | null;
}

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

    const isUSMap = data.states.some(s => s.postalCode?.length === 2);
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

    dataPromise.then(([regions, bounds]: [any, any]) => {
      // Parse the map description to get colors and highlighted states
      const parsedRequest = parseMapDescription(data.states[0]?.state || "");
      console.log('Parsed request:', parsedRequest);
      
      // Draw regions (states or countries)
      svg.append("g")
        .selectAll("path")
        .data(regions.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d: any) => {
          const geoName = d.properties.NAME || d.properties.name;
          const regionData = data.states.find(s => {
            if (!s.state || !geoName) return false;
            const geoNameLower = geoName.toLowerCase().trim();
            const stateLower = s.state.toLowerCase().trim();
            const match = geoNameLower === stateLower;
            if (match) {
              console.log('Match found:', { data: s.state, geo: geoName });
            }
            return match;
          });
          
          // If it's a highlighted state, use blue (#3b82f6), otherwise use the parsed default fill color
          return regionData ? "#3b82f6" : parsedRequest.defaultFill;
        })
        .attr("stroke", "white")
        .attr("stroke-width", "0.5px");

      // Draw bounds
      svg.append("path")
        .datum(bounds)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", "1px");

      // Add labels for highlighted states
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
          const matchingState = data.states.find(s => 
            s.state.toLowerCase().trim() === geoName.toLowerCase().trim()
          );
          return matchingState ? matchingState.postalCode : "";
        })
        .attr("fill", "black")
        .attr("font-size", "14px");

      // Add tooltips
      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

      svg.selectAll("path")
        .on("mouseover", (event, d: any) => {
          const geoName = d.properties?.NAME || d.properties?.name;
          const regionData = data.states.find(s => 
            s.state?.toLowerCase().trim() === geoName?.toLowerCase().trim()
          );
          if (regionData) {
            tooltip
              .style("visibility", "visible")
              .html(`<strong>${regionData.state}</strong>`);
          }
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