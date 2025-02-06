import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { MapData } from '@/lib/types';
import { getColorScale } from '@/lib/mapUtils';
import { createProjection } from './MapProjection';
import { createTooltip, handleMouseOver, handleMouseMove, handleMouseOut } from './MapTooltip';

interface MapVisualizationProps {
  data: MapData | null;
  detailLevel?: string;
}

const MapVisualization = ({ data, detailLevel = "110m" }: MapVisualizationProps) => {
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

    const projection = createProjection(width, height, detailLevel);
    const path = d3.geoPath().projection(projection);
    const colorScale = getColorScale(data.minSales, data.maxSales);
    const tooltip = createTooltip();

    // Load world GeoJSON data based on detail level
    d3.json(`https://cdn.jsdelivr.net/npm/world-atlas@2/countries-${detailLevel}.json`)
      .then((world: any) => {
        const countries = topojson.feature(world, world.objects.countries);
        
        // Create map background (all countries)
        svg.append("g")
          .selectAll("path")
          .data(countries.features)
          .join("path")
          .attr("d", path)
          .attr("fill", "#e5e7eb") // Light gray for countries without data
          .attr("stroke", "#fff")
          .attr("stroke-width", "0.5px");

        // Add colored countries with data
        svg.append("g")
          .selectAll("path")
          .data(countries.features)
          .join("path")
          .attr("d", path)
          .attr("fill", (d: any) => {
            const countryData = data.states.find(s => s.state === d.properties.name);
            return countryData ? colorScale(countryData.sales) : "transparent";
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", "0.5px")
          .style("pointer-events", "all")
          .on("mouseover", (event, d: any) => {
            const countryData = data.states.find(s => s.state === d.properties.name);
            handleMouseOver(event, d, tooltip, countryData);
          })
          .on("mousemove", (event) => handleMouseMove(event, tooltip))
          .on("mouseout", () => handleMouseOut(tooltip));
      })
      .catch(error => {
        console.error('Error loading world map data:', error);
      });

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [data, detailLevel]);

  return (
    <div className="map-visualization w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
};

export default MapVisualization;