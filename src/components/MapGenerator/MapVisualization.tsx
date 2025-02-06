import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { getColorScale, formatSalesNumber } from '@/lib/mapUtils';

interface MapVisualizationProps {
  data: MapData | null;
}

const MapVisualization = ({ data }: MapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 960;
    const height = 600;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("style", "max-width: 100%; height: auto;");

    // Determine if we're showing a US map or world map based on the data
    const isUSMap = data.states.some(s => s.postalCode?.length === 2);

    const projection = isUSMap 
      ? d3.geoAlbersUsa()
          .scale(1000)
          .translate([width / 2, height / 2])
      : d3.geoEqualEarth()
          .scale(180)
          .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const colorScale = getColorScale(data.minSales, data.maxSales);

    // Load appropriate GeoJSON data based on map type
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
      // Draw region boundaries (states or countries)
      svg.append("g")
        .selectAll("path")
        .data(regions.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d: any) => {
          const regionData = data.states.find(s => 
            isUSMap 
              ? s.state === d.properties.name
              : s.postalCode === d.properties.ISO_A2
          );
          return regionData ? colorScale(regionData.sales) : "#eee";
        })
        .attr("stroke", "white")
        .attr("stroke-width", "0.5px");

      // Draw bounds
      svg.append("path")
        .datum(bounds)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", "1px");

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
          const regionData = data.states.find(s => 
            isUSMap 
              ? s.state === d.properties.name
              : s.postalCode === d.properties.ISO_A2
          );
          if (regionData) {
            tooltip
              .style("visibility", "visible")
              .html(`
                <strong>${regionData.state}</strong><br/>
                ${isUSMap ? 'Sales' : 'GDP'}: ${formatSalesNumber(regionData.sales)}
              `);
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