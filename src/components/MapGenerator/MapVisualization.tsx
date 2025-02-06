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
            // Handle both "United States" and "United States of America"
            if (stateLower === "usa" || stateLower === "united states") {
              return geoNameLower === "united states of america" || geoNameLower === "united states";
            }
            const match = geoNameLower === stateLower;
            if (match) {
              console.log('Match found:', { data: s.state, geo: geoName });
            }
            return match;
          });
          
          return regionData ? (data.highlightColor || "#ef4444") : data.defaultFill || parsedRequest.defaultFill;
        })
        .attr("stroke", "none");  // Remove stroke from polygons

      // Draw bounds with explicit white stroke
      svg.append("path")
        .datum(bounds)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#ffffff")  // Force white stroke for boundaries
        .attr("stroke-width", "1");  // Force 1px stroke width for boundaries

      // Add labels for highlighted regions
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
          const matchingState = data.states.find(s => {
            const stateLower = s.state.toLowerCase().trim();
            const geoNameLower = geoName.toLowerCase().trim();
            // Handle USA case
            if (stateLower === "usa" || stateLower === "united states") {
              return geoNameLower === "united states of america" || geoNameLower === "united states";
            }
            return geoNameLower === stateLower;
          });
          return matchingState ? matchingState.state.toUpperCase() : "";
        })
        .attr("fill", data.labelColor || "#000000")
        .attr("font-size", data.labelSize || "14px");

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
          const regionData = data.states.find(s => {
            const stateLower = s.state?.toLowerCase().trim();
            const geoNameLower = geoName?.toLowerCase().trim();
            if (stateLower === "usa" || stateLower === "united states") {
              return geoNameLower === "united states of america" || geoNameLower === "united states";
            }
            return geoNameLower === stateLower;
          });
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